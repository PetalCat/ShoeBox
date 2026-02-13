import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable('events', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	description: text('description').default(''),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	isPublicView: integer('is_public_view', { mode: 'boolean' }).notNull().default(false),
	allowUploads: integer('allow_uploads', { mode: 'boolean' }).notNull().default(true)
});

export const tokens = sqliteTable('tokens', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	eventId: integer('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	label: text('label').default(''),
	permission: text('permission', { enum: ['view', 'upload'] })
		.notNull()
		.default('view'),
	expiresAt: text('expires_at'),
	revokedAt: text('revoked_at'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const media = sqliteTable('media', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	eventId: integer('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	uuid: text('uuid').notNull().unique(),
	originalName: text('original_name').notNull(),
	storedRelpath: text('stored_relpath').notNull(),
	mime: text('mime').notNull(),
	kind: text('kind', { enum: ['image', 'video'] }).notNull(),
	sizeBytes: integer('size_bytes').notNull(),
	width: integer('width'),
	height: integer('height'),
	durationSeconds: real('duration_seconds'),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	uploaderName: text('uploader_name').default(''),
	sha256: text('sha256').notNull(),
	phash: text('phash')
});

export const adminUsers = sqliteTable('admin_users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});

export const sessions = sqliteTable('sessions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	adminUserId: integer('admin_user_id')
		.notNull()
		.references(() => adminUsers.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: text('expires_at').notNull(),
	createdAt: text('created_at')
		.notNull()
		.$defaultFn(() => new Date().toISOString())
});
