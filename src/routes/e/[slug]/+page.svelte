<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import InfiniteMediaGrid from '$lib/components/InfiniteMediaGrid.svelte';
	import UploadZone from '$lib/components/UploadZone.svelte';

	let { data } = $props();

	let uploadOpen = $state(false);
	let gridRef = $state<ReturnType<typeof InfiniteMediaGrid> | null>(null);

	function handleUploadComplete() {
		// Re-fetch by resetting the grid via a key change
		gridKey++;
	}

	let gridKey = $state(0);
</script>

<svelte:head>
	<title>{data.event.title} - ShoeBox</title>
</svelte:head>

<div class="min-h-screen bg-cream-50">
	<Header
		title={data.event.title}
		canUpload={data.canUpload}
		onUploadClick={() => (uploadOpen = true)}
	/>

	{#if data.event.description}
		<div class="mx-auto max-w-5xl px-4 pt-4">
			<p class="text-sm text-kraft-500">{data.event.description}</p>
		</div>
	{/if}

	<div class="mx-auto max-w-5xl p-4">
		{#key gridKey}
			<InfiniteMediaGrid bind:this={gridRef} eventSlug={data.event.slug} token={data.token} />
		{/key}
	</div>

	{#if data.canUpload}
		<UploadZone
			eventSlug={data.event.slug}
			token={data.token}
			bind:open={uploadOpen}
			onComplete={handleUploadComplete}
		/>
	{/if}
</div>
