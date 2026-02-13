<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import InfiniteMediaGrid from '$lib/components/InfiniteMediaGrid.svelte';
	import MediaFilterBar from '$lib/components/MediaFilterBar.svelte';
	import BulkActionBar from '$lib/components/BulkActionBar.svelte';
	import EventStats from '$lib/components/EventStats.svelte';

	import { toastStore } from '$lib/stores';

	let { data, form } = $props();

	let showDeleteConfirm = $state(false);
	let copiedToken = $state<string | null>(null);
	let filters = $state<Record<string, string>>({});
	let selectedUuids = $state(new Set<string>());
	let uploaders = $state<{ name: string; count: number }[]>([]);
	let gridRef = $state<ReturnType<typeof InfiniteMediaGrid> | null>(null);

	let timeout: ReturnType<typeof setTimeout>;

	function autosave(event: Event) {
		const formEl = (event.target as HTMLElement).closest('form');
		if (!formEl) return;

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			const formData = new FormData(formEl);
			fetch(formEl.action, {
				method: 'POST',
				body: formData
			}).then((res) => {
				if (res.ok) {
					toastStore.send('<img src="/logo.png" class="h-5 w-auto" alt="Saved" />', 'success');
				} else {
					toastStore.send('Failed to save', 'error');
				}
			});
		}, 1000);
	}

	function copyLink(token: string) {
		const url = `${$page.url.origin}/e/${data.event.slug}?t=${token}`;
		navigator.clipboard.writeText(url);
		copiedToken = token;
		setTimeout(() => (copiedToken = null), 2000);
	}

	function handleDeleted(uuids: string[]) {
		gridRef?.removeItems(uuids);
	}

	function handleDeselect() {
		selectedUuids = new Set();
	}
</script>

<svelte:head>
	<title>{data.event.title} - ShoeBox Admin</title>
</svelte:head>

<div class="mb-6">
	<a href="/admin" class="text-sm text-kraft-500 transition hover:text-coral-500"
		>&larr; Back to events</a
	>
</div>

<!-- Event Header -->
<div class="pixel-border pixel-shadow mb-8 bg-cream-100 p-6">
	<form method="POST" action="?/updateSettings" use:enhance class="space-y-4">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<input
					type="text"
					name="title"
					value={data.event.title}
					oninput={autosave}
					class="w-full border-none bg-transparent text-xl font-bold text-kraft-700 focus:ring-0 focus:outline-none"
				/>
				<textarea
					name="description"
					placeholder="Add a description..."
					rows={2}
					oninput={autosave}
					class="mt-1 w-full resize-none border-none bg-transparent text-sm text-kraft-500 focus:ring-0 focus:outline-none"
					>{data.event.description}</textarea
				>
			</div>
		</div>
		<div class="flex flex-wrap items-center gap-6">
			<label class="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					name="allowUploads"
					checked={data.event.allowUploads}
					onchange={autosave}
					class="accent-coral-500"
				/>
				<span class="text-kraft-600">Allow uploads</span>
			</label>
			<label class="flex items-center gap-2 text-sm">
				<input
					type="checkbox"
					name="isPublicView"
					checked={data.event.isPublicView}
					onchange={autosave}
					class="accent-coral-500"
				/>
				<span class="text-kraft-600">Public viewing</span>
			</label>
		</div>
	</form>
</div>

<!-- Tokens Section -->
<div class="pixel-border pixel-shadow mb-8 bg-cream-100 p-6">
	<h2 class="mb-4 text-base font-bold text-kraft-700">Share Links</h2>

	{#if form?.newToken}
		<div class="mb-4 border-2 border-green-700 bg-green-100 p-4">
			<p class="mb-2 text-sm font-medium text-green-800">New token created! Copy the link below:</p>
			<div class="flex items-center gap-2">
				<code
					class="flex-1 border-2 border-kraft-300 bg-cream-50 p-2 text-xs break-all text-kraft-600"
				>
					{$page.url.origin}/e/{data.event.slug}?t={form.newToken}
				</code>
				<button
					onclick={() => copyLink(form?.newToken ?? '')}
					class="pixel-btn pixel-shadow-coral border-2 border-coral-700 bg-coral-500 px-3 py-2 text-sm text-white hover:bg-coral-600"
				>
					{copiedToken === form?.newToken ? 'Copied!' : 'Copy'}
				</button>
			</div>
		</div>
	{/if}

	<form method="POST" action="?/createToken" use:enhance class="mb-4 flex flex-wrap gap-3">
		<input
			type="text"
			name="label"
			placeholder="Label (optional)"
			class="pixel-border-light bg-cream-50 px-4 py-2 text-sm text-kraft-800 focus:border-coral-500 focus:outline-none"
		/>
		<select
			name="permission"
			class="pixel-border-light bg-cream-50 px-4 py-2 text-sm text-kraft-800 focus:border-coral-500 focus:outline-none"
		>
			<option value="upload">Can Upload + View</option>
			<option value="view">View Only</option>
		</select>
		<button
			type="submit"
			class="pixel-btn pixel-shadow-coral border-2 border-coral-700 bg-coral-500 px-5 py-2 text-sm font-bold text-white hover:bg-coral-600"
		>
			Generate Link
		</button>
	</form>

	{#if data.tokens.length > 0}
		<div class="space-y-2">
			{#each data.tokens as token}
				<div class="flex items-center justify-between border-2 border-kraft-300 bg-cream-50 p-3">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							{#if token.label}
								<span class="text-sm font-medium text-kraft-700">{token.label}</span>
							{/if}
							<span class="border border-kraft-400 bg-cream-200 px-2 py-0.5 text-xs text-kraft-600">
								{token.permission}
							</span>
							{#if token.revokedAt}
								<span class="border border-red-600 bg-red-100 px-2 py-0.5 text-xs text-red-700"
									>revoked</span
								>
							{/if}
						</div>
						<code class="mt-1 block truncate text-xs text-kraft-400">{token.token}</code>
					</div>
					<div class="flex items-center gap-2">
						{#if !token.revokedAt}
							<button
								onclick={() => copyLink(token.token)}
								class="pixel-btn border-2 border-kraft-400 bg-cream-200 px-3 py-1.5 text-xs font-medium text-kraft-600 hover:bg-cream-300"
							>
								{copiedToken === token.token ? 'Copied!' : 'Copy Link'}
							</button>
							<form method="POST" action="?/revokeToken" use:enhance>
								<input type="hidden" name="tokenId" value={token.id} />
								<button
									type="submit"
									class="pixel-btn border-2 border-red-600 bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
								>
									Revoke
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-kraft-400">No share links created yet.</p>
	{/if}
</div>

<!-- Stats Section -->
<div class="mb-8">
	<EventStats eventSlug={data.event.slug} onUploadersLoaded={(u) => (uploaders = u)} />
</div>

<!-- Media Section -->
<div class="pixel-border pixel-shadow mb-8 bg-cream-100 p-6">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-base font-bold text-kraft-700">Media</h2>
		<a
			href="/api/events/{data.event.slug}/export"
			class="pixel-btn pixel-shadow-sm border-2 border-kraft-600 bg-cream-200 px-4 py-2 text-sm font-medium text-kraft-600 hover:bg-cream-300"
		>
			Download All
		</a>
	</div>

	<div class="mb-4">
		<MediaFilterBar {uploaders} bind:filters />
	</div>

	<InfiniteMediaGrid
		bind:this={gridRef}
		eventSlug={data.event.slug}
		{filters}
		adminMode={true}
		bind:selectedUuids
	/>
</div>

<BulkActionBar
	{selectedUuids}
	eventSlug={data.event.slug}
	onDeleted={handleDeleted}
	onDeselect={handleDeselect}
/>

<!-- Danger Zone -->
<div class="border-3 border-red-600 bg-cream-100 p-6">
	<h2 class="mb-2 text-base font-bold text-red-700">Danger Zone</h2>
	{#if !showDeleteConfirm}
		<button
			onclick={() => (showDeleteConfirm = true)}
			class="pixel-btn pixel-shadow-sm border-2 border-red-600 bg-red-100 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-200"
		>
			Delete Event
		</button>
	{:else}
		<p class="mb-3 text-sm text-red-700">
			This will permanently delete the event and all its media. Are you sure?
		</p>
		<div class="flex gap-3">
			<form method="POST" action="?/deleteEvent" use:enhance>
				<button
					type="submit"
					class="pixel-btn pixel-shadow-sm border-2 border-red-800 bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
				>
					Yes, Delete Everything
				</button>
			</form>
			<button
				onclick={() => (showDeleteConfirm = false)}
				class="pixel-btn border-2 border-kraft-600 bg-cream-200 px-5 py-2.5 text-sm font-medium text-kraft-600 hover:bg-cream-300"
			>
				Cancel
			</button>
		</div>
	{/if}
</div>
