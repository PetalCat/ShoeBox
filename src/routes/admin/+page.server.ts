import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { destroySession } from '$lib/server/auth.js';
import { desc } from 'drizzle-orm';
import { count, eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const eventsList = db
		.select({
			id: schema.events.id,
			slug: schema.events.slug,
			title: schema.events.title,
			createdAt: schema.events.createdAt,
			isPublicView: schema.events.isPublicView,
			allowUploads: schema.events.allowUploads
		})
		.from(schema.events)
		.orderBy(desc(schema.events.createdAt))
		.all();

	// Get media counts per event
	const mediaCounts = db
		.select({
			eventId: schema.media.eventId,
			count: count()
		})
		.from(schema.media)
		.groupBy(schema.media.eventId)
		.all();

	const countMap = new Map(mediaCounts.map((m) => [m.eventId, m.count]));

	const events = eventsList.map((e) => ({
		...e,
		mediaCount: countMap.get(e.id) ?? 0
	}));

	return { events };
};

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
}

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString().trim();

		if (!title || title.length < 1) {
			return fail(400, { error: 'Event title is required' });
		}

		let slug = slugify(title);
		if (!slug) slug = 'event';

		// Ensure unique slug
		const existing = db
			.select({ id: schema.events.id })
			.from(schema.events)
			.where(eq(schema.events.slug, slug))
			.get();

		if (existing) {
			slug = `${slug}-${Date.now().toString(36)}`;
		}

		db.insert(schema.events)
			.values({
				slug,
				title,
				createdAt: new Date().toISOString()
			})
			.run();

		throw redirect(302, `/admin/events/${slug}`);
	},

	logout: async ({ cookies }) => {
		const sessionToken = cookies.get('session');
		if (sessionToken) {
			destroySession(sessionToken);
			cookies.delete('session', { path: '/' });
		}
		throw redirect(302, '/login');
	}
};
