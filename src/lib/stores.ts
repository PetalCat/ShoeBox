import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
	id: number;
	message: string;
	type: ToastType;
};

function createToastStore() {
	const { subscribe, update } = writable<ToastItem[]>([]);
	let nextId = 0;

	return {
		subscribe,
		send: (message: string, type: ToastType = 'info') => {
			const id = nextId++;
			update((toasts) => [...toasts, { id, message, type }]);
			setTimeout(() => {
				update((toasts) => toasts.filter((t) => t.id !== id));
			}, 3000);
		}
	};
}

export const toastStore = createToastStore();
