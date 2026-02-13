import { redirect, fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq } from 'drizzle-orm';
import { createToken, revokeToken, listTokensForEvent } from '$lib/server/tokens.js';
import { deleteMedia } from '$lib/server/media.js';

export const load: PageServerLoad = async ({ params }) => {
	const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();

	if (!event) throw error(404, 'Event not found');

	const tokens = listTokensForEvent(event.id);

	return { event, tokens };
};

export const actions: Actions = {
	createToken: async ({ request, params }) => {
		const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();
		if (!event) throw error(404);

		const data = await request.formData();
		const permission = data.get('permission')?.toString() as 'view' | 'upload';
		const label = data.get('label')?.toString().trim() || '';

		if (!permission || !['view', 'upload'].includes(permission)) {
			return fail(400, { tokenError: 'Invalid permission' });
		}

		const token = createToken(event.id, permission, label);
		return { newToken: token, newTokenSlug: params.slug };
	},

	revokeToken: async ({ request }) => {
		const data = await request.formData();
		const tokenId = Number(data.get('tokenId'));
		if (!tokenId) return fail(400, { tokenError: 'Invalid token ID' });
		revokeToken(tokenId);
	},

	deleteMedia: async ({ request }) => {
		const data = await request.formData();
		const mediaId = Number(data.get('mediaId'));
		if (!mediaId) return fail(400, { error: 'Invalid media ID' });
		deleteMedia(mediaId);
	},

	updateSettings: async ({ request, params }) => {
		const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();
		if (!event) throw error(404);

		const data = await request.formData();
		const allowUploads = data.get('allowUploads') === 'on';
		const isPublicView = data.get('isPublicView') === 'on';
		const title = data.get('title')?.toString().trim() || event.title;
		const description = data.get('description')?.toString().trim() || '';

		db.update(schema.events)
			.set({ allowUploads, isPublicView, title, description })
			.where(eq(schema.events.id, event.id))
			.run();
	},

	deleteEvent: async ({ params }) => {
		const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();
		if (!event) throw error(404);

		db.delete(schema.events).where(eq(schema.events.id, event.id)).run();

		// Clean up files
		const { rmSync } = await import('fs');
		const { join } = await import('path');
		const { DATA_DIR } = await import('$lib/server/db/index.js');
		try {
			rmSync(join(DATA_DIR, 'events', String(event.id)), { recursive: true, force: true });
		} catch {
			// ignore
		}

		throw redirect(302, '/admin');
	}
};
