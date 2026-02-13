<script lang="ts">
	import { onMount } from 'svelte';
	import Lightbox from './Lightbox.svelte';

	type MediaItem = {
		id: number;
		uuid: string;
		originalName: string;
		kind: string;
		mime: string;
		sizeBytes: number;
		uploaderName: string;
		width: number | null;
		height: number | null;
		createdAt: string;
	};

	type Filters = {
		kind?: string;
		uploader?: string;
		dateFrom?: string;
		dateTo?: string;
		sort?: string;
	};

	type DateGroup = {
		date: string;
		label: string;
		items: MediaItem[];
	};

	let {
		eventSlug,
		filters = {},
		adminMode = false,
		selectedUuids = $bindable(new Set<string>()),
		token = ''
	}: {
		eventSlug: string;
		filters?: Filters;
		adminMode?: boolean;
		selectedUuids?: Set<string>;
		token?: string;
	} = $props();

	let items = $state<MediaItem[]>([]);
	let loading = $state(false);
	let hasMore = $state(true);
	let nextCursor = $state<string | null>(null);
	let nextOffset = $state<number | null>(null);
	let sentinel = $state<HTMLDivElement | null>(null);
	let selectionMode = $state(false);
	let lastClickedIndex = $state<number | null>(null);
	let lightboxOpen = $state(false);
	let lightboxIndex = $state(0);
	let initialLoadDone = $state(false);

	let dateGroups = $derived.by(() => {
		const groups: DateGroup[] = [];
		let currentDate = '';
		let currentGroup: DateGroup | null = null;
		for (const item of items) {
			const date = item.createdAt.split('T')[0];
			if (date !== currentDate) {
				currentDate = date;
				currentGroup = { date, label: formatDateLabel(date), items: [] };
				groups.push(currentGroup);
			}
			currentGroup!.items.push(item);
		}
		return groups;
	});

	let lightboxItems = $derived(
		items.map((i) => ({
			id: i.id,
			uuid: i.uuid,
			originalName: i.originalName,
			kind: i.kind,
			mime: i.mime
		}))
	);

	function formatDateLabel(dateStr: string): string {
		const date = new Date(dateStr + 'T00:00:00');
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		if (date.getTime() === today.getTime()) return 'Today';
		if (date.getTime() === yesterday.getTime()) return 'Yesterday';
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
		});
	}

	async function fetchPage() {
		if (loading || !hasMore) return;
		loading = true;
		const params = new URLSearchParams();
		params.set('limit', '50');
		if (nextCursor) params.set('cursor', nextCursor);
		if (nextOffset !== null) params.set('offset', String(nextOffset));
		if (filters.kind) params.set('kind', filters.kind);
		if (filters.uploader) params.set('uploader', filters.uploader);
		if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
		if (filters.dateTo) params.set('dateTo', filters.dateTo);
		if (filters.sort) params.set('sort', filters.sort);
		if (token) params.set('t', token);
		try {
			const res = await fetch(`/api/events/${eventSlug}/media?${params}`);
			if (!res.ok) throw new Error('Failed to fetch');
			const data = await res.json();
			items = [...items, ...data.items];
			nextCursor = data.nextCursor;
			nextOffset = data.nextOffset;
			hasMore = !!(data.nextCursor || data.nextOffset);
		} catch {
			hasMore = false;
		} finally {
			loading = false;
			initialLoadDone = true;
		}
	}

	function reset() {
		items = [];
		nextCursor = null;
		nextOffset = null;
		hasMore = true;
		initialLoadDone = false;
		selectionMode = false;
		selectedUuids = new Set();
		lastClickedIndex = null;
		fetchPage();
	}

	let prevFiltersJson = $state('');
	$effect(() => {
		const json = JSON.stringify(filters);
		if (json !== prevFiltersJson) {
			prevFiltersJson = json;
			if (initialLoadDone || prevFiltersJson !== '{}') reset();
		}
	});

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) fetchPage();
			},
			{ rootMargin: '200px' }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	onMount(() => {
		fetchPage();
	});

	function toggleSelection(uuid: string, index: number, event: MouseEvent) {
		if (!selectionMode) return;
		if (event.shiftKey && lastClickedIndex !== null) {
			const start = Math.min(lastClickedIndex, index);
			const end = Math.max(lastClickedIndex, index);
			const newSet = new Set(selectedUuids);
			for (let i = start; i <= end; i++) newSet.add(items[i].uuid);
			selectedUuids = newSet;
		} else {
			const newSet = new Set(selectedUuids);
			if (newSet.has(uuid)) newSet.delete(uuid);
			else newSet.add(uuid);
			selectedUuids = newSet;
		}
		lastClickedIndex = index;
	}

	function handleItemClick(index: number, event: MouseEvent) {
		if (selectionMode) toggleSelection(items[index].uuid, index, event);
		else {
			lightboxIndex = index;
			lightboxOpen = true;
		}
	}

	function toggleSelectionMode() {
		selectionMode = !selectionMode;
		if (!selectionMode) {
			selectedUuids = new Set();
			lastClickedIndex = null;
		}
	}

	export function removeItems(uuids: string[]) {
		const uuidSet = new Set(uuids);
		items = items.filter((i) => !uuidSet.has(i.uuid));
		const newSelected = new Set(selectedUuids);
		for (const uuid of uuids) newSelected.delete(uuid);
		selectedUuids = newSelected;
	}
</script>

{#if adminMode}
	<div class="mb-3 flex items-center gap-3">
		<button
			onclick={toggleSelectionMode}
			class="pixel-btn px-3 py-1.5 text-sm transition {selectionMode
				? 'bg-coral-500 text-white'
				: 'bg-cream-200 text-kraft-600 hover:bg-cream-300'}"
			style={selectionMode ? 'border-color: var(--color-coral-700)' : ''}
		>
			{selectionMode ? 'Cancel Selection' : 'Select Items'}
		</button>
		{#if selectionMode}
			<span class="text-xs text-kraft-400">Click to select, Shift+click for range</span>
		{/if}
	</div>
{/if}

{#if !initialLoadDone}
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
		{#each Array(12) as _}
			<div class="aspect-square animate-pulse bg-cream-200" style="border-radius: 4px;"></div>
		{/each}
	</div>
{:else if items.length === 0}
	<div class="flex flex-col items-center justify-center py-20 text-center">
		<p class="mb-2 text-4xl">📸</p>
		<h2 class="mb-1 font-bold text-kraft-600">No photos yet</h2>
		<p class="text-sm text-kraft-400">Be the first to add some memories!</p>
	</div>
{:else}
	{#each dateGroups as group}
		<div class="mt-5 mb-1 first:mt-0">
			<h3
				class="sticky top-0 z-10 bg-cream-50/90 px-1 py-2 text-xs font-bold tracking-wider text-kraft-400 uppercase backdrop-blur-sm"
			>
				{group.label}
			</h3>
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
				{#each group.items as item}
					{@const globalIndex = items.indexOf(item)}
					<button
						onclick={(e) => handleItemClick(globalIndex, e)}
						class="group relative aspect-square overflow-hidden bg-cream-200 transition focus:outline-none
							{selectionMode && selectedUuids.has(item.uuid)
							? 'ring-3 ring-coral-500 ring-offset-1'
							: 'hover:brightness-95'}"
						style="border-radius: 4px;"
					>
						{#if item.kind === 'image'}
							<img
								src="/api/media/{item.uuid}/thumb"
								alt={item.originalName}
								class="h-full w-full object-cover"
								loading="lazy"
							/>
						{:else}
							<img
								src="/api/media/{item.uuid}/poster"
								alt={item.originalName}
								class="h-full w-full object-cover"
								loading="lazy"
							/>
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="bg-black/50 p-2 text-white" style="border-radius: 4px;">
									<svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"
										><path d="M8 5v14l11-7z" /></svg
									>
								</div>
							</div>
						{/if}

						{#if selectionMode}
							<div class="absolute top-2 left-2 z-10">
								<div class="pixel-checkbox {selectedUuids.has(item.uuid) ? 'checked' : ''}">
									{#if selectedUuids.has(item.uuid)}
										<svg
											class="h-3.5 w-3.5 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									{/if}
								</div>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/each}

	<div bind:this={sentinel} class="h-4"></div>
	{#if loading}
		<div class="flex justify-center py-6">
			<p class="animate-pulse text-sm text-kraft-400">Loading...</p>
		</div>
	{/if}
{/if}

<Lightbox items={lightboxItems} bind:currentIndex={lightboxIndex} bind:open={lightboxOpen} />

<style>
	.pixel-checkbox {
		width: 22px;
		height: 22px;
		background: rgba(0, 0, 0, 0.3);
		border: 2px solid white;
		display: flex;
		align-items: center;
		justify-content: center;
		image-rendering: pixelated;
		border-radius: 2px;
	}
	.pixel-checkbox.checked {
		background: var(--color-coral-500);
		border-color: var(--color-coral-700);
	}
</style>
