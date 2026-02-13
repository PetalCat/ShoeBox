import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.adminUser) {
		throw redirect(302, '/login');
	}
	return { user: locals.adminUser };
};
