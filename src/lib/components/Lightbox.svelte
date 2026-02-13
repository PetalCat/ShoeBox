<script lang="ts">
	import { fade } from 'svelte/transition';

	type MediaItem = {
		id: number;
		uuid: string;
		originalName: string;
		kind: string;
		mime: string;
	};

	let {
		items,
		currentIndex = $bindable(0),
		open = $bindable(false)
	}: {
		items: MediaItem[];
		currentIndex: number;
		open: boolean;
	} = $props();

	let touchStartX = $state(0);
	let touchStartY = $state(0);

	function close() {
		open = false;
	}
	function prev() {
		if (currentIndex > 0) currentIndex--;
	}
	function next() {
		if (currentIndex < items.length - 1) currentIndex++;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') close();
		if (e.key === 'ArrowLeft') prev();
		if (e.key === 'ArrowRight') next();
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touchStartX;
		const dy = e.changedTouches[0].clientY - touchStartY;
		if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
			if (dx > 0) prev();
			else next();
		}
	}

	let currentItem = $derived(items[currentIndex]);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open && currentItem}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
	>
		<button
			onclick={close}
			aria-label="Close"
			class="absolute top-4 right-4 z-10 bg-white/10 p-2 text-white transition hover:bg-white/20"
			style="border-radius: 4px;"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>

		{#if currentIndex > 0}
			<button
				onclick={prev}
				aria-label="Previous"
				class="absolute left-2 z-10 bg-white/10 p-2 text-white transition hover:bg-white/20 sm:left-4"
				style="border-radius: 4px;"
			>
				<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>
		{/if}

		{#if currentIndex < items.length - 1}
			<button
				onclick={next}
				aria-label="Next"
				class="absolute right-2 z-10 bg-white/10 p-2 text-white transition hover:bg-white/20 sm:right-4"
				style="border-radius: 4px;"
			>
				<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{/if}

		<div class="max-h-[90vh] max-w-[90vw]">
			{#if currentItem.kind === 'image'}
				<img
					src="/api/media/{currentItem.uuid}/original"
					alt={currentItem.originalName}
					class="max-h-[90vh] max-w-[90vw] object-contain"
					style="image-rendering: auto;"
				/>
			{:else}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					src="/api/media/{currentItem.uuid}/original"
					controls
					class="max-h-[90vh] max-w-[90vw]"
					playsinline
				></video>
			{/if}
		</div>

		<div class="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4">
			<span class="text-sm text-white/60">{currentIndex + 1} / {items.length}</span>
			<a
				href="/api/media/{currentItem.uuid}/original"
				download={currentItem.originalName}
				class="pixel-btn bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
				style="border-color: rgba(255,255,255,0.2);"
			>
				Download
			</a>
		</div>
	</div>
{/if}
