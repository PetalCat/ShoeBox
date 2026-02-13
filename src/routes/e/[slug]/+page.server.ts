import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();

	if (!event) throw error(404, 'Event not found');

	const token = url.searchParams.get('t') || '';

	// Check access: admin, public view, or valid token
	const isAdmin = !!locals.adminUser;
	const hasTokenAccess = !!locals.eventToken && locals.eventToken.eventId === event.id;
	const isPublic = event.isPublicView;

	if (!isAdmin && !hasTokenAccess && !isPublic) {
		throw error(403, 'Access denied. You need a valid link to view this event.');
	}

	const canUpload =
		event.allowUploads &&
		(isAdmin || (hasTokenAccess && locals.eventToken?.permission === 'upload'));

	return {
		event: {
			title: event.title,
			slug: event.slug,
			description: event.description
		},
		canUpload,
		token
	};
};
