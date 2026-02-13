<script lang="ts">
	type MediaItem = {
		id: number;
		uuid: string;
		originalName: string;
		kind: string;
		mime: string;
	};

	let { items, onSelect }: { items: MediaItem[]; onSelect: (index: number) => void } = $props();
</script>

{#if items.length === 0}
	<div class="flex flex-col items-center justify-center py-20 text-center">
		<p class="mb-3 text-3xl text-kraft-300">[?]</p>
		<h2 class="mb-1 font-semibold text-kraft-600">No photos yet</h2>
		<p class="text-sm text-kraft-400">Be the first to add some memories!</p>
	</div>
{:else}
	<div class="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 md:grid-cols-4">
		{#each items as item, index}
			<button
				onclick={() => onSelect(index)}
				class="group relative aspect-square overflow-hidden border-2 border-kraft-600 bg-cream-200 transition hover:border-coral-500 focus:ring-2 focus:ring-coral-500 focus:outline-none"
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
						<div class="border-2 border-white bg-black/50 p-2 transition group-hover:scale-110">
							<svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
								<path d="M8 5v14l11-7z" />
							</svg>
						</div>
					</div>
				{/if}
			</button>
		{/each}
	</div>
{/if}
