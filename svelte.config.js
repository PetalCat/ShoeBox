import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csrf: {
			trustedOrigins: [
				'http://10.10.10.14:3847',
				'http://localhost:3847',
				'http://127.0.0.1:3847'
			]
		}
	}
};

export default config;
