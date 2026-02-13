import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { loginAdmin, hasAdminUsers, createAdminUser, createSession } from '$lib/server/auth.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.adminUser) {
		throw redirect(302, '/admin');
	}
	return { needsSetup: !hasAdminUsers() };
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required', username });
		}

		const result = await loginAdmin(username, password);
		if (!result) {
			return fail(400, { error: 'Invalid username or password', username });
		}

		cookies.set('session', result.sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(302, '/admin');
	},

	register: async ({ request, cookies }) => {
		if (hasAdminUsers()) {
			return fail(400, { error: 'An admin account already exists' });
		}

		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		if (!username || username.length < 3) {
			return fail(400, { error: 'Username must be at least 3 characters', username });
		}
		if (!password || password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters', username });
		}
		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', username });
		}

		const user = await createAdminUser(username, password);
		const sessionToken = createSession(user.id);

		cookies.set('session', sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(302, '/admin');
	}
};
