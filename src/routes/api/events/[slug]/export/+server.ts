import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq } from 'drizzle-orm';
import { getOriginalPath } from '$lib/server/media.js';
import archiver from 'archiver';
import { existsSync } from 'fs';
import { Readable } from 'stream';

export const GET: RequestHandler = async ({ params, locals }) => {
	// Admin only
	if (!locals.adminUser) throw error(403, 'Admin access required');

	const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();

	if (!event) throw error(404, 'Event not found');

	const mediaList = db.select().from(schema.media).where(eq(schema.media.eventId, event.id)).all();

	if (mediaList.length === 0) {
		throw error(404, 'No media to export');
	}

	const archive = archiver('zip', { zlib: { level: 1 } });

	for (const item of mediaList) {
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
			'Content-Disposition': `attachment; filename="${event.slug}-export.zip"`
		}
	});
};
