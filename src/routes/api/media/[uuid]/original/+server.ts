import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq } from 'drizzle-orm';
import { getOriginalPath } from '$lib/server/media.js';
import { readFileSync, existsSync } from 'fs';

export const GET: RequestHandler = async ({ params, locals }) => {
	const item = db.select().from(schema.media).where(eq(schema.media.uuid, params.uuid)).get();

	if (!item) throw error(404, 'Media not found');

	// Check access
	const isAdmin = !!locals.adminUser;
	const event = db.select().from(schema.events).where(eq(schema.events.id, item.eventId)).get();

	if (!event) throw error(404);

	const hasToken = !!locals.eventToken && locals.eventToken.eventId === item.eventId;
	const isPublic = event.isPublicView;

	if (!isAdmin && !hasToken && !isPublic) {
		throw error(403, 'Access denied');
	}

	const filePath = getOriginalPath(item.eventId, item.storedRelpath);
	if (!existsSync(filePath)) throw error(404, 'File not found');

	const fileBuffer = readFileSync(filePath);

	return new Response(fileBuffer, {
		headers: {
			'Content-Type': item.mime,
			'Content-Disposition': `inline; filename="${item.originalName}"`,
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
