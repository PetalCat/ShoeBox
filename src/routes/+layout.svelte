<script lang="ts">
	import './layout.css';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>ShoeBox</title>
	<link rel="icon" href="/logo.png" />
</svelte:head>

<Toast />
{@render children()}
