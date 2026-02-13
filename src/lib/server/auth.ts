import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { db, schema } from './db/index.js';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export function createSession(adminUserId: number): string {
	const token = randomUUID();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

	db.insert(schema.sessions)
		.values({
			adminUserId,
			token,
			expiresAt,
			createdAt: new Date().toISOString()
		})
		.run();

	return token;
}

export function validateSession(token: string): { id: number; username: string } | null {
	const row = db
		.select({
			userId: schema.adminUsers.id,
			username: schema.adminUsers.username,
			expiresAt: schema.sessions.expiresAt
		})
		.from(schema.sessions)
		.innerJoin(schema.adminUsers, eq(schema.sessions.adminUserId, schema.adminUsers.id))
		.where(eq(schema.sessions.token, token))
		.get();

	if (!row) return null;
	if (new Date(row.expiresAt) < new Date()) {
		destroySession(token);
		return null;
	}

	return { id: row.userId, username: row.username };
}

export function destroySession(token: string): void {
	db.delete(schema.sessions).where(eq(schema.sessions.token, token)).run();
}

export function hasAdminUsers(): boolean {
	const row = db.select({ id: schema.adminUsers.id }).from(schema.adminUsers).limit(1).get();
	return !!row;
}

export async function createAdminUser(
	username: string,
	password: string
): Promise<{ id: number; username: string }> {
	const passwordHash = await hashPassword(password);
	const result = db
		.insert(schema.adminUsers)
		.values({
			username,
			passwordHash,
			createdAt: new Date().toISOString()
		})
		.returning({ id: schema.adminUsers.id, username: schema.adminUsers.username })
		.get();
	return result;
}

export async function loginAdmin(
	username: string,
	password: string
): Promise<{ sessionToken: string; user: { id: number; username: string } } | null> {
	const user = db
		.select()
		.from(schema.adminUsers)
		.where(eq(schema.adminUsers.username, username))
		.get();

	if (!user) return null;

	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) return null;

	const sessionToken = createSession(user.id);
	return { sessionToken, user: { id: user.id, username: user.username } };
}
