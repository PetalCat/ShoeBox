<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { toastStore } from '$lib/stores';
</script>

<div class="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
	{#each $toastStore as toast (toast.id)}
		<div
			in:fly={{ x: 100, duration: 300 }}
			out:fade={{ duration: 200 }}
			class="pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg {toast.type ===
			'success'
				? 'bg-green-600 text-white'
				: toast.type === 'error'
					? 'bg-red-600 text-white'
					: 'bg-kraft-700 text-white'}"
		>
			<div class="flex items-center gap-2">
				{@html toast.message}
			</div>
		</div>
	{/each}
</div>
