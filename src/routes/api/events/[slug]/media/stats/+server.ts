import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq, and, sql, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();

	if (!event) throw error(404, 'Event not found');

	// Check access
	const isAdmin = !!locals.adminUser;
	const hasToken = !!locals.eventToken && locals.eventToken.eventId === event.id;
	const isPublic = event.isPublicView;

	if (!isAdmin && !hasToken && !isPublic) {
		throw error(403, 'Access denied');
	}

	// Counts by kind
	const counts = db
		.select({
			kind: schema.media.kind,
			count: count(),
			totalSize: sql<number>`sum(${schema.media.sizeBytes})`
		})
		.from(schema.media)
		.where(eq(schema.media.eventId, event.id))
		.groupBy(schema.media.kind)
		.all();

	let imageCount = 0;
	let videoCount = 0;
	let totalSize = 0;
	for (const row of counts) {
		if (row.kind === 'image') imageCount = row.count;
		if (row.kind === 'video') videoCount = row.count;
		totalSize += row.totalSize ?? 0;
	}

	// Uploaders list with counts
	const uploaders = db
		.select({
			name: schema.media.uploaderName,
			count: count()
		})
		.from(schema.media)
		.where(eq(schema.media.eventId, event.id))
		.groupBy(schema.media.uploaderName)
		.orderBy(sql`count(*) desc`)
		.all();

	// Timeline: count by date
	const timeline = db
		.select({
			date: sql<string>`date(${schema.media.createdAt})`.as('date'),
			count: count()
		})
		.from(schema.media)
		.where(eq(schema.media.eventId, event.id))
		.groupBy(sql`date(${schema.media.createdAt})`)
		.orderBy(sql`date(${schema.media.createdAt})`)
		.all();

	return json({
		imageCount,
		videoCount,
		totalCount: imageCount + videoCount,
		totalSize,
		uploaders,
		timeline
	});
};
