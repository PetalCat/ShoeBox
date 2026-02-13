import sharp from 'sharp';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { db, schema, DATA_DIR } from './db/index.js';
import { eq, and } from 'drizzle-orm';

const execFileAsync = promisify(execFile);

const IMAGE_MIMES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/heic',
	'image/heif',
	'image/avif'
]);

const VIDEO_MIMES = new Set([
	'video/mp4',
	'video/quicktime',
	'video/webm',
	'video/x-msvideo',
	'video/x-matroska'
]);

export function getMediaKind(mime: string): 'image' | 'video' | null {
	if (IMAGE_MIMES.has(mime)) return 'image';
	if (VIDEO_MIMES.has(mime)) return 'video';
	return null;
}

function computeSha256(buffer: Buffer): string {
	return createHash('sha256').update(buffer).digest('hex');
}

// Perceptual hash: resize to 8x8 grayscale, compute average, produce 64-bit hash
async function computePhash(buffer: Buffer): Promise<string | null> {
	try {
		const { data } = await sharp(buffer)
			.resize(8, 8, { fit: 'fill' })
			.grayscale()
			.raw()
			.toBuffer({ resolveWithObject: true });

		const pixels = Array.from(data);
		const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;

		let hash = '';
		for (const px of pixels) {
			hash += px >= avg ? '1' : '0';
		}
		// Convert 64-bit binary string to 16-char hex
		let hex = '';
		for (let i = 0; i < 64; i += 4) {
			hex += parseInt(hash.slice(i, i + 4), 2).toString(16);
		}
		return hex;
	} catch {
		return null;
	}
}

function hammingDistance(a: string, b: string): number {
	let dist = 0;
	for (let i = 0; i < Math.min(a.length, b.length); i++) {
		const ba = parseInt(a[i], 16);
		const bb = parseInt(b[i], 16);
		let xor = ba ^ bb;
		while (xor) {
			dist += xor & 1;
			xor >>= 1;
		}
	}
	return dist;
}

// Max hamming distance to consider two images perceptually identical
const PHASH_THRESHOLD = 8;

function eventDir(eventId: number): string {
	return join(DATA_DIR, 'events', String(eventId));
}

function qualityScore(item: {
	sizeBytes: number;
	width: number | null;
	height: number | null;
}): number {
	const pixels = (item.width ?? 0) * (item.height ?? 0);
	// Weighted: resolution matters most, file size as tiebreaker
	return pixels + item.sizeBytes / 1000;
}

export async function saveMedia(
	eventId: number,
	file: {
		buffer: Buffer;
		originalName: string;
		mime: string;
	},
	uploaderName: string = ''
): Promise<{ id: number; uuid: string } | null> {
	const kind = getMediaKind(file.mime);
	if (!kind) return null;

	const fileUuid = uuidv4();
	const sha256 = computeSha256(file.buffer);

	// Exact duplicate by SHA-256 — always skip
	const exactDupe = db
		.select({ id: schema.media.id, uuid: schema.media.uuid })
		.from(schema.media)
		.where(eq(schema.media.sha256, sha256))
		.get();
	if (exactDupe) return exactDupe;

	// Get dimensions early (needed for quality comparison)
	let width: number | null = null;
	let height: number | null = null;
	let durationSeconds: number | null = null;
	let phash: string | null = null;

	if (kind === 'image') {
		try {
			const metadata = await sharp(file.buffer).metadata();
			width = metadata.width ?? null;
			height = metadata.height ?? null;
		} catch {
			// ignore metadata failures
		}
		phash = await computePhash(file.buffer);

		// Perceptual dedup: find visually similar images in the same event
		if (phash) {
			const candidates = db
				.select({
					id: schema.media.id,
					uuid: schema.media.uuid,
					phash: schema.media.phash,
					sizeBytes: schema.media.sizeBytes,
					width: schema.media.width,
					height: schema.media.height,
					storedRelpath: schema.media.storedRelpath,
					eventId: schema.media.eventId
				})
				.from(schema.media)
				.where(and(eq(schema.media.eventId, eventId), eq(schema.media.kind, 'image')))
				.all();

			for (const candidate of candidates) {
				if (!candidate.phash) continue;
				const dist = hammingDistance(phash, candidate.phash);
				if (dist <= PHASH_THRESHOLD) {
					// Perceptual match found — keep the higher quality version
					const newScore = qualityScore({ sizeBytes: file.buffer.length, width, height });
					const existingScore = qualityScore({
						sizeBytes: candidate.sizeBytes,
						width: candidate.width,
						height: candidate.height
					});

					if (newScore <= existingScore) {
						// Existing is better or equal — skip the new upload
						return { id: candidate.id, uuid: candidate.uuid };
					}

					// New upload is better — replace the existing file and update the record
					const dateDir = new Date().toISOString().split('T')[0];
					const ext = file.originalName.split('.').pop() || 'bin';
					const relPath = join('original', dateDir, `${fileUuid}.${ext}`);
					const absPath = join(eventDir(eventId), relPath);

					mkdirSync(dirname(absPath), { recursive: true });
					writeFileSync(absPath, file.buffer);

					// Delete old original file
					const oldPath = getOriginalPath(candidate.eventId, candidate.storedRelpath);
					try {
						unlinkSync(oldPath);
					} catch {
						/* ignore */
					}

					// Update DB record with better version
					db.update(schema.media)
						.set({
							uuid: fileUuid,
							originalName: file.originalName,
							storedRelpath: relPath,
							mime: file.mime,
							sizeBytes: file.buffer.length,
							width,
							height,
							sha256,
							phash
						})
						.where(eq(schema.media.id, candidate.id))
						.run();

					// Regenerate thumbnail with higher-quality source
					const oldThumb = getThumbPath(candidate.eventId, candidate.uuid);
					try {
						unlinkSync(oldThumb);
					} catch {
						/* ignore */
					}
					generateThumbnail(eventId, fileUuid, file.buffer).catch(() => {});

					return { id: candidate.id, uuid: fileUuid };
				}
			}
		}
	} else if (kind === 'video') {
		// Videos only get exact SHA-256 dedup (already handled above)
	}

	// No duplicate — save as new
	const dateDir = new Date().toISOString().split('T')[0];
	const ext = file.originalName.split('.').pop() || 'bin';
	const relPath = join('original', dateDir, `${fileUuid}.${ext}`);
	const absPath = join(eventDir(eventId), relPath);

	mkdirSync(dirname(absPath), { recursive: true });
	writeFileSync(absPath, file.buffer);

	if (kind === 'image') {
		generateThumbnail(eventId, fileUuid, file.buffer).catch(() => {});
	} else if (kind === 'video') {
		try {
			const probe = await probeVideo(absPath);
			width = probe.width;
			height = probe.height;
			durationSeconds = probe.duration;
		} catch {
			// ignore probe failures
		}
		generatePoster(eventId, fileUuid, absPath).catch(() => {});
	}

	const result = db
		.insert(schema.media)
		.values({
			eventId,
			uuid: fileUuid,
			originalName: file.originalName,
			storedRelpath: relPath,
			mime: file.mime,
			kind,
			sizeBytes: file.buffer.length,
			width,
			height,
			durationSeconds,
			createdAt: new Date().toISOString(),
			uploaderName,
			sha256,
			phash
		})
		.returning({ id: schema.media.id, uuid: schema.media.uuid })
		.get();

	return result;
}

async function generateThumbnail(eventId: number, fileUuid: string, buffer: Buffer): Promise<void> {
	const thumbDir = join(eventDir(eventId), 'derived', 'thumbs');
	mkdirSync(thumbDir, { recursive: true });
	const thumbPath = join(thumbDir, `${fileUuid}.webp`);

	await sharp(buffer)
		.resize(512, 512, { fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 80 })
		.toFile(thumbPath);
}

async function generatePoster(eventId: number, fileUuid: string, videoPath: string): Promise<void> {
	const posterDir = join(eventDir(eventId), 'derived', 'posters');
	mkdirSync(posterDir, { recursive: true });
	const posterPath = join(posterDir, `${fileUuid}.webp`);

	// Extract frame at 1 second using ffmpeg
	try {
		await execFileAsync('ffmpeg', [
			'-i',
			videoPath,
			'-ss',
			'1',
			'-vframes',
			'1',
			'-vf',
			'scale=512:512:force_original_aspect_ratio=decrease',
			'-f',
			'image2',
			'-y',
			posterPath + '.jpg'
		]);

		// Convert to webp via sharp
		await sharp(posterPath + '.jpg')
			.webp({ quality: 80 })
			.toFile(posterPath);

		// Clean up temp jpg
		try {
			unlinkSync(posterPath + '.jpg');
		} catch {
			// ignore
		}
	} catch {
		// ffmpeg not available or failed — no poster
	}
}

async function probeVideo(
	videoPath: string
): Promise<{ width: number | null; height: number | null; duration: number | null }> {
	try {
		const { stdout } = await execFileAsync('ffprobe', [
			'-v',
			'quiet',
			'-print_format',
			'json',
			'-show_streams',
			'-show_format',
			videoPath
		]);

		const data = JSON.parse(stdout);
		const videoStream = data.streams?.find((s: { codec_type: string }) => s.codec_type === 'video');
		return {
			width: videoStream?.width ?? null,
			height: videoStream?.height ?? null,
			duration: data.format?.duration ? parseFloat(data.format.duration) : null
		};
	} catch {
		return { width: null, height: null, duration: null };
	}
}

export function getOriginalPath(eventId: number, relpath: string): string {
	return join(eventDir(eventId), relpath);
}

export function getThumbPath(eventId: number, fileUuid: string): string {
	return join(eventDir(eventId), 'derived', 'thumbs', `${fileUuid}.webp`);
}

export function getPosterPath(eventId: number, fileUuid: string): string {
	return join(eventDir(eventId), 'derived', 'posters', `${fileUuid}.webp`);
}

export function bulkDeleteMedia(mediaIds: number[]): void {
	for (const id of mediaIds) {
		deleteMedia(id);
	}
}

export function deleteMedia(mediaId: number): void {
	const item = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();

	if (!item) return;

	// Delete files
	const origPath = getOriginalPath(item.eventId, item.storedRelpath);
	const thumbPath = getThumbPath(item.eventId, item.uuid);
	const posterPath = getPosterPath(item.eventId, item.uuid);

	for (const p of [origPath, thumbPath, posterPath]) {
		try {
			unlinkSync(p);
		} catch {
			// file may not exist
		}
	}

	db.delete(schema.media).where(eq(schema.media.id, mediaId)).run();
}
