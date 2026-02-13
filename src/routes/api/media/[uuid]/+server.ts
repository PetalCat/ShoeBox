import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq } from 'drizzle-orm';
import { deleteMedia } from '$lib/server/media.js';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.adminUser) throw error(403, 'Admin access required');

	const item = db.select().from(schema.media).where(eq(schema.media.uuid, params.uuid)).get();

	if (!item) throw error(404, 'Media not found');

	deleteMedia(item.id);

	return new Response(null, { status: 204 });
};
