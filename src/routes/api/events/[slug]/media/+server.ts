import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq, desc, asc, lt, and, gte, lte, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals, url }) => {
	const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();

	if (!event) throw error(404, 'Event not found');

	// Check access
	const isAdmin = !!locals.adminUser;
	const hasToken = !!locals.eventToken && locals.eventToken.eventId === event.id;
	const isPublic = event.isPublicView;

	if (!isAdmin && !hasToken && !isPublic) {
		throw error(403, 'Access denied');
	}

	const cursor = url.searchParams.get('cursor');
	const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);
	const offset = Number(url.searchParams.get('offset') || 0);
	const sort = url.searchParams.get('sort') || 'newest';
	const kind = url.searchParams.get('kind');
	const uploader = url.searchParams.get('uploader');
	const dateFrom = url.searchParams.get('dateFrom');
	const dateTo = url.searchParams.get('dateTo');

	let conditions = [eq(schema.media.eventId, event.id)];

	// Filter by kind
	if (kind === 'image' || kind === 'video') {
		conditions.push(eq(schema.media.kind, kind));
	}

	// Filter by uploader
	if (uploader) {
		conditions.push(eq(schema.media.uploaderName, uploader));
	}

	// Filter by date range
	if (dateFrom) {
		conditions.push(gte(schema.media.createdAt, dateFrom));
	}
	if (dateTo) {
		// Include the full end date by appending end-of-day
		conditions.push(lte(schema.media.createdAt, dateTo + 'T23:59:59.999Z'));
	}

	// Determine sort order
	let orderBy;
	let useCursor = true;
	switch (sort) {
		case 'oldest':
			orderBy = asc(schema.media.id);
			useCursor = true;
			break;
		case 'largest':
			orderBy = desc(schema.media.sizeBytes);
			useCursor = false;
			break;
		case 'smallest':
			orderBy = asc(schema.media.sizeBytes);
			useCursor = false;
			break;
		case 'uploader':
			orderBy = asc(schema.media.uploaderName);
			useCursor = false;
			break;
		case 'newest':
		default:
			orderBy = desc(schema.media.id);
			useCursor = true;
			break;
	}

	// For cursor-based sorts (newest/oldest), use cursor pagination
	// For other sorts, use offset pagination
	if (useCursor && cursor) {
		if (sort === 'oldest') {
			conditions.push(sql`${schema.media.id} > ${Number(cursor)}`);
		} else {
			conditions.push(lt(schema.media.id, Number(cursor)));
		}
	}

	const baseQuery = db
		.select({
			id: schema.media.id,
			uuid: schema.media.uuid,
			originalName: schema.media.originalName,
			kind: schema.media.kind,
			mime: schema.media.mime,
			sizeBytes: schema.media.sizeBytes,
			uploaderName: schema.media.uploaderName,
			width: schema.media.width,
			height: schema.media.height,
			createdAt: schema.media.createdAt
		})
		.from(schema.media)
		.where(and(...conditions))
		.orderBy(orderBy)
		.limit(limit + 1);

	const items = (!useCursor && offset > 0 ? baseQuery.offset(offset) : baseQuery).all();

	const hasMore = items.length > limit;
	if (hasMore) items.pop();

	let nextCursor: string | null = null;
	let nextOffset: number | null = null;

	if (hasMore && items.length > 0) {
		if (useCursor) {
			nextCursor = String(items[items.length - 1].id);
		} else {
			nextOffset = offset + limit;
		}
	}

	return json({ items, nextCursor, nextOffset });
};
