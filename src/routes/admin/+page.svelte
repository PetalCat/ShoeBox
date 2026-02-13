<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let showCreateForm = $state(false);
</script>

<svelte:head>
	<title>ShoeBox - Dashboard</title>
</svelte:head>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-xl font-bold text-kraft-700">Events</h1>
	<button
		onclick={() => (showCreateForm = !showCreateForm)}
		class="pixel-btn-primary px-4 py-2 text-sm font-bold"
	>
		{showCreateForm ? 'Cancel' : '+ New Event'}
	</button>
</div>

{#if showCreateForm}
	<div class="pixel-panel mb-6 p-5">
		{#if form?.error}
			<div
				class="mb-4 border-2 border-coral-400 bg-coral-500/10 p-3 text-sm text-coral-700"
				style="border-radius: 3px;"
			>
				{form.error}
			</div>
		{/if}
		<form method="POST" action="?/create" use:enhance class="flex gap-3">
			<input
				type="text"
				name="title"
				placeholder="Event name (e.g. Sarah's Wedding)"
				required
				class="pixel-input flex-1 px-4 py-2.5 text-sm text-kraft-800"
			/>
			<button type="submit" class="pixel-btn-primary px-6 py-2.5 text-sm font-bold">Create</button>
		</form>
	</div>
{/if}

{#if data.events.length === 0}
	<div class="py-16 text-center">
		<img src="/logo.png" alt="No events" class="pixel-art mx-auto mb-4 h-[60px] w-[120px] opacity-50" />
		<h2 class="mb-1 font-bold text-kraft-700">No events yet</h2>
		<p class="text-sm text-kraft-500">Create your first event to start collecting photos!</p>
	</div>
{:else}
	<div class="grid gap-3 sm:grid-cols-2">
		{#each data.events as event}
			<a
				href="/admin/events/{event.slug}"
				class="pixel-panel group p-5 transition hover:-translate-y-0.5"
			>
				<h2 class="mb-1 font-bold text-kraft-700 transition group-hover:text-coral-500">
					{event.title}
				</h2>
				<div class="flex items-center gap-2 text-sm text-kraft-400">
					<span>{event.mediaCount} {event.mediaCount === 1 ? 'item' : 'items'}</span>
					<span>·</span>
					<span>{new Date(event.createdAt).toLocaleDateString()}</span>
				</div>
				<div class="mt-2 flex gap-2">
					{#if event.allowUploads}
						<span
							class="bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
							style="border-radius:3px;">Uploads on</span
						>
					{/if}
					{#if event.isPublicView}
						<span
							class="bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
							style="border-radius:3px;">Public</span
						>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{/if}
