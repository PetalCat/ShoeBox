import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq, and, inArray } from 'drizzle-orm';
import { getOriginalPath } from '$lib/server/media.js';
import archiver from 'archiver';
import { existsSync } from 'fs';
import { Readable } from 'stream';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.adminUser) throw error(403, 'Admin access required');

	const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();

	if (!event) throw error(404, 'Event not found');

	const body = await request.json();
	const uuids: string[] = body.uuids;

	if (!Array.isArray(uuids) || uuids.length === 0) {
		throw error(400, 'uuids array required');
	}

	const mediaItems = db
		.select()
		.from(schema.media)
		.where(and(eq(schema.media.eventId, event.id), inArray(schema.media.uuid, uuids)))
		.all();

	if (mediaItems.length === 0) {
		throw error(404, 'No matching media found');
	}

	const archive = archiver('zip', { zlib: { level: 1 } });

	for (const item of mediaItems) {
		const filePath = getOriginalPath(event.id, item.storedRelpath);
		if (existsSync(filePath)) {
			archive.file(filePath, { name: item.originalName });
		}
	}

	archive.finalize();

	const webStream = Readable.toWeb(archive) as ReadableStream;

	return new Response(webStream, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${event.slug}-selected.zip"`
		}
	});
};
