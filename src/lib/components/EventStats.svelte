<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	let {
		eventSlug,
		onUploadersLoaded = () => {}
	}: {
		eventSlug: string;
		onUploadersLoaded?: (uploaders: { name: string; count: number }[]) => void;
	} = $props();

	type Stats = {
		imageCount: number;
		videoCount: number;
		totalCount: number;
		totalSize: number;
		uploaders: { name: string; count: number }[];
		timeline: { date: string; count: number }[];
	};

	let stats = $state<Stats | null>(null);
	let loading = $state(true);
	let expanded = $state(false);

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
		if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
		return (bytes / 1073741824).toFixed(1) + ' GB';
	}

	let maxUploaderCount = $derived(stats ? Math.max(...stats.uploaders.map((u) => u.count), 1) : 1);
	let maxTimelineCount = $derived(stats ? Math.max(...stats.timeline.map((t) => t.count), 1) : 1);

	onMount(async () => {
		try {
			const res = await fetch(`/api/events/${eventSlug}/media/stats`);
			if (res.ok) {
				stats = await res.json();
				if (stats) onUploadersLoaded(stats.uploaders);
			}
		} catch {
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="flex gap-8 py-4">
		{#each Array(3) as _}
			<div>
				<div class="mb-1 h-8 w-14 animate-pulse bg-cream-200" style="border-radius: 3px;"></div>
				<div class="h-4 w-10 animate-pulse bg-cream-200" style="border-radius: 3px;"></div>
			</div>
		{/each}
	</div>
{:else if stats && stats.totalCount > 0}
	<div class="flex items-center justify-between py-2">
		<div class="flex flex-wrap gap-8">
			<div>
				<p class="text-2xl font-bold text-kraft-700">{stats.imageCount}</p>
				<p class="text-xs text-kraft-400">Photos</p>
			</div>
			<div>
				<p class="text-2xl font-bold text-kraft-700">{stats.videoCount}</p>
				<p class="text-xs text-kraft-400">Videos</p>
			</div>
			<div>
				<p class="text-2xl font-bold text-kraft-700">{formatBytes(stats.totalSize)}</p>
				<p class="text-xs text-kraft-400">Total size</p>
			</div>
		</div>

		<button
			onclick={() => (expanded = !expanded)}
			class="pixel-btn bg-cream-200 px-3 py-1.5 text-xs text-kraft-500 hover:bg-cream-300"
		>
			{expanded ? 'Hide' : 'Details'}
		</button>
	</div>

	{#if expanded}
		<div transition:slide={{ duration: 200 }} class="mt-3 space-y-5 border-t border-cream-300 pt-4">
			{#if stats.uploaders.length > 0}
				<div>
					<h4 class="mb-2 text-xs font-bold text-kraft-400 uppercase">Contributors</h4>
					<div class="space-y-1.5">
						{#each stats.uploaders as u}
							<div class="flex items-center gap-3">
								<span class="w-24 shrink-0 truncate text-sm text-kraft-600"
									>{u.name || 'Anonymous'}</span
								>
								<div class="h-4 flex-1 overflow-hidden bg-cream-200" style="border-radius: 2px;">
									<div
										class="h-full bg-coral-500"
										style="width: {(u.count / maxUploaderCount) * 100}%"
									></div>
								</div>
								<span class="shrink-0 text-xs font-bold text-kraft-500">{u.count}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if stats.timeline.length > 1}
				<div>
					<h4 class="mb-2 text-xs font-bold text-kraft-400 uppercase">Timeline</h4>
					<div
						class="flex items-end gap-0.5 bg-cream-200 p-2"
						style="height: 80px; border-radius: 3px;"
					>
						{#each stats.timeline as t}
							<div
								class="group relative flex flex-1 flex-col items-center justify-end"
								style="height: 100%;"
							>
								<div
									class="w-full min-w-[3px] bg-coral-500 transition group-hover:bg-coral-600"
									style="height: {(t.count / maxTimelineCount) * 100}%"
								></div>
								<div
									class="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 bg-kraft-700 px-2 py-0.5 text-xs whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100"
									style="border-radius: 3px;"
								>
									{t.date}: {t.count}
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-1 flex justify-between text-[10px] text-kraft-300">
						<span>{stats.timeline[0]?.date}</span>
						<span>{stats.timeline[stats.timeline.length - 1]?.date}</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
{/if}
