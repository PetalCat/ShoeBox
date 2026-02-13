declare global {
	namespace App {
		interface Locals {
			adminUser?: {
				id: number;
				username: string;
			};
			eventToken?: {
				eventId: number;
				permission: 'view' | 'upload';
			};
		}
	}
}

export {};
