import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.adminUser) {
		throw redirect(302, '/admin');
	}
	throw redirect(302, '/login');
};
