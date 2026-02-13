import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq, and, inArray } from 'drizzle-orm';
import { bulkDeleteMedia } from '$lib/server/media.js';

export const DELETE: RequestHandler = async ({ params, locals, request }) => {
	if (!locals.adminUser) throw error(403, 'Admin access required');

	const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();

	if (!event) throw error(404, 'Event not found');

	const body = await request.json();
	const uuids: string[] = body.uuids;

	if (!Array.isArray(uuids) || uuids.length === 0) {
		throw error(400, 'uuids array required');
	}

	// Look up media IDs from UUIDs, scoped to this event
	const mediaItems = db
		.select({ id: schema.media.id })
		.from(schema.media)
		.where(and(eq(schema.media.eventId, event.id), inArray(schema.media.uuid, uuids)))
		.all();

	const mediaIds = mediaItems.map((m) => m.id);
	if (mediaIds.length > 0) {
		bulkDeleteMedia(mediaIds);
	}

	return json({ deleted: mediaIds.length });
};
