<script lang="ts">
	let { data, children } = $props();
</script>

<div class="min-h-screen bg-cream-50">
	<header class="border-b-2 border-cream-300 bg-cream-100">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
			<a href="/admin" class="flex items-center gap-2 transition hover:text-coral-500">
				<img src="/logo.png" alt="" class="h-5 w-auto" style="image-rendering: pixelated;" />
				<span class="text-base font-bold text-kraft-700">ShoeBox</span>
			</a>
			<div class="flex items-center gap-4">
				<span class="text-sm text-kraft-500">{data.user.username}</span>
				<form method="POST" action="/admin?/logout">
					<button
						type="submit"
						class="pixel-btn bg-cream-200 px-3 py-1.5 text-sm text-kraft-600 hover:bg-cream-300"
					>
						Logout
					</button>
				</form>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>
</div>
