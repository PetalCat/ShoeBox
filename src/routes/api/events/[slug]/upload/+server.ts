import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { db, schema } from '$lib/server/db/index.js';
import { eq } from 'drizzle-orm';
import { saveMedia, getMediaKind } from '$lib/server/media.js';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const event = db.select().from(schema.events).where(eq(schema.events.slug, params.slug)).get();

	if (!event) throw error(404, 'Event not found');
	if (!event.allowUploads) throw error(403, 'Uploads are disabled for this event');

	// Check upload permission
	const isAdmin = !!locals.adminUser;
	const hasUploadToken =
		!!locals.eventToken &&
		locals.eventToken.eventId === event.id &&
		locals.eventToken.permission === 'upload';

	if (!isAdmin && !hasUploadToken) {
		throw error(403, 'Upload not permitted');
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const uploaderName = formData.get('uploaderName')?.toString() || '';

	if (!file || !(file instanceof File)) {
		throw error(400, 'No file provided');
	}

	const kind = getMediaKind(file.type);
	if (!kind) {
		throw error(400, 'Unsupported file type: ' + file.type);
	}

	// Limit file size to 100MB
	if (file.size > 100 * 1024 * 1024) {
		throw error(400, 'File too large (max 100MB)');
	}

	const buffer = Buffer.from(await file.arrayBuffer());

	const result = await saveMedia(
		event.id,
		{
			buffer,
			originalName: file.name,
			mime: file.type
		},
		uploaderName
	);

	if (!result) {
		throw error(500, 'Failed to save file');
	}

	return json({ success: true, uuid: result.uuid });
};
