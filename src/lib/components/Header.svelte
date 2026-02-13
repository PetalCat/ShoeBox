<script lang="ts">
	let {
		title,
		canUpload = false,
		onUploadClick
	}: { title: string; canUpload?: boolean; onUploadClick?: () => void } = $props();
</script>

<header class="sticky top-0 z-30 border-b-2 border-cream-300 bg-cream-100">
	<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
		<div class="flex min-w-0 items-center gap-2">
			<img src="/logo.png" alt="" class="h-5 w-auto shrink-0" style="image-rendering: pixelated;" />
			<h1 class="truncate text-base font-bold text-kraft-700">{title}</h1>
		</div>
		{#if canUpload && onUploadClick}
			<button onclick={onUploadClick} class="pixel-btn-primary px-4 py-2 text-sm font-bold">
				+ Upload
			</button>
		{/if}
	</div>
</header>
