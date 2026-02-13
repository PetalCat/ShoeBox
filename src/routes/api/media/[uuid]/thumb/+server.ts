import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq } from 'drizzle-orm';
import { getThumbPath } from '$lib/server/media.js';
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

	const thumbPath = getThumbPath(item.eventId, item.uuid);
	if (!existsSync(thumbPath)) {
		// Fallback: return a 1x1 transparent webp
		throw error(404, 'Thumbnail not ready');
	}

	const fileBuffer = readFileSync(thumbPath);

	return new Response(fileBuffer, {
		headers: {
			'Content-Type': 'image/webp',
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
