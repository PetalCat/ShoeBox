import { randomBytes } from 'crypto';
import { db, schema } from './db/index.js';
import { eq } from 'drizzle-orm';

function generateToken(): string {
	return randomBytes(24).toString('base64url');
}

export function createToken(
	eventId: number,
	permission: 'view' | 'upload',
	label: string = '',
	expiresAt?: string
): string {
	const token = generateToken();

	db.insert(schema.tokens)
		.values({
			eventId,
			token,
			label,
			permission,
			expiresAt: expiresAt ?? null,
			createdAt: new Date().toISOString()
		})
		.run();

	return token;
}

export function validateToken(
	token: string
): { eventId: number; permission: 'view' | 'upload' } | null {
	const row = db
		.select({
			eventId: schema.tokens.eventId,
			permission: schema.tokens.permission,
			expiresAt: schema.tokens.expiresAt,
			revokedAt: schema.tokens.revokedAt
		})
		.from(schema.tokens)
		.where(eq(schema.tokens.token, token))
		.get();

	if (!row) return null;
	if (row.revokedAt) return null;
	if (row.expiresAt && new Date(row.expiresAt) < new Date()) return null;

	return { eventId: row.eventId, permission: row.permission as 'view' | 'upload' };
}

export function revokeToken(tokenId: number): void {
	db.update(schema.tokens)
		.set({ revokedAt: new Date().toISOString() })
		.where(eq(schema.tokens.id, tokenId))
		.run();
}

export function listTokensForEvent(eventId: number) {
	return db.select().from(schema.tokens).where(eq(schema.tokens.eventId, eventId)).all();
}
