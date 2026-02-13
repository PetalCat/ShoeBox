import type { Handle } from '@sveltejs/kit';
import { runMigrations } from '$lib/server/db/migrate.js';
import { validateSession } from '$lib/server/auth.js';
import { validateToken } from '$lib/server/tokens.js';

// Run migrations on startup
runMigrations();

export const handle: Handle = async ({ event, resolve }) => {
	// Resolve admin session from cookie
	const sessionToken = event.cookies.get('session');
	if (sessionToken) {
		const user = validateSession(sessionToken);
		if (user) {
			event.locals.adminUser = user;
		} else {
			// Expired/invalid session — clear cookie
			event.cookies.delete('session', { path: '/' });
		}
	}

	// Resolve event token from ?t= query param
	const tokenParam = event.url.searchParams.get('t');
	if (tokenParam) {
		const tokenData = validateToken(tokenParam);
		if (tokenData) {
			event.locals.eventToken = tokenData;
		}
	}

	return resolve(event);
};
