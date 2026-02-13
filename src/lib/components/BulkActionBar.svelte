<script lang="ts">
	import { fly } from 'svelte/transition';

	let {
		selectedUuids = new Set<string>(),
		eventSlug,
		onDeleted = () => {},
		onDeselect = () => {}
	}: {
		selectedUuids: Set<string>;
		eventSlug: string;
		onDeleted?: (uuids: string[]) => void;
		onDeselect?: () => void;
	} = $props();

	let showDeleteConfirm = $state(false);
	let deleting = $state(false);
	let downloading = $state(false);
	let count = $derived(selectedUuids.size);

	async function handleDelete() {
		if (deleting) return;
		deleting = true;
		try {
			const uuids = Array.from(selectedUuids);
			const res = await fetch(`/api/events/${eventSlug}/media/bulk`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ uuids })
			});
			if (!res.ok) throw new Error('Delete failed');
			onDeleted(uuids);
		} catch {
		} finally {
			deleting = false;
			showDeleteConfirm = false;
		}
	}

	async function handleDownload() {
		if (downloading) return;
		downloading = true;
		try {
			const uuids = Array.from(selectedUuids);
			const res = await fetch(`/api/events/${eventSlug}/export/selective`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ uuids })
			});
			if (!res.ok) throw new Error('Download failed');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${eventSlug}-selected.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch {
		} finally {
			downloading = false;
		}
	}
</script>

{#if count > 0}
	<div
		transition:fly={{ y: 80, duration: 200 }}
		class="fixed inset-x-0 bottom-0 z-40 border-t-2 border-cream-300 bg-cream-100 px-4 py-3"
	>
		<div class="mx-auto flex max-w-5xl items-center justify-between">
			<span class="text-sm font-bold text-kraft-700">
				{count}
				{count === 1 ? 'item' : 'items'} selected
			</span>
			<div class="flex items-center gap-2">
				{#if !showDeleteConfirm}
					<button
						onclick={handleDownload}
						disabled={downloading}
						class="pixel-btn bg-cream-200 px-3 py-1.5 text-sm text-kraft-600 hover:bg-cream-300 disabled:opacity-50"
					>
						{downloading ? 'Downloading...' : 'Download'}
					</button>
					<button
						onclick={() => (showDeleteConfirm = true)}
						class="pixel-btn bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-200"
						style="border-color: #b91c1c;"
					>
						Delete
					</button>
					<button
						onclick={onDeselect}
						class="pixel-btn bg-cream-200 px-3 py-1.5 text-sm text-kraft-400 hover:bg-cream-300"
					>
						Deselect
					</button>
				{:else}
					<span class="text-sm text-red-700">Delete {count} items?</span>
					<button
						onclick={handleDelete}
						disabled={deleting}
						class="pixel-btn-primary px-3 py-1.5 text-sm font-bold disabled:opacity-50"
						style="background: #dc2626; border-color: #991b1b;"
					>
						{deleting ? 'Deleting...' : 'Confirm'}
					</button>
					<button
						onclick={() => (showDeleteConfirm = false)}
						class="pixel-btn bg-cream-200 px-3 py-1.5 text-sm text-kraft-600 hover:bg-cream-300"
					>
						Cancel
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
