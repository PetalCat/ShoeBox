<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<svelte:head>
	<title>ShoeBox - {data.needsSetup ? 'Create Account' : 'Login'}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="pixel-panel w-full max-w-sm p-8">
		<div class="mb-6 text-center">
			<img
				src="/logo.png"
				alt=""
				class="mx-auto mb-3 h-10 w-auto"
				style="image-rendering: pixelated;"
			/>
			<h1 class="mb-2 text-2xl font-bold text-kraft-700">ShoeBox</h1>
			{#if data.needsSetup}
				<p class="text-sm text-kraft-500">Create your admin account to get started.</p>
			{:else}
				<p class="text-sm text-kraft-500">Sign in to manage your events.</p>
			{/if}
		</div>

		{#if form?.error}
			<div
				class="mb-4 border-2 border-coral-400 bg-coral-500/10 p-3 text-sm text-coral-700"
				style="border-radius: 3px;"
			>
				{form.error}
			</div>
		{/if}

		{#if data.needsSetup}
			<form method="POST" action="?/register" use:enhance class="space-y-4">
				<div>
					<label for="username" class="mb-1 block text-sm font-medium text-kraft-600"
						>Username</label
					>
					<input
						type="text"
						id="username"
						name="username"
						value={form?.username ?? ''}
						required
						minlength={3}
						class="pixel-input w-full px-3 py-2.5 text-sm text-kraft-800"
						placeholder="admin"
					/>
				</div>
				<div>
					<label for="password" class="mb-1 block text-sm font-medium text-kraft-600"
						>Password</label
					>
					<input
						type="password"
						id="password"
						name="password"
						required
						minlength={8}
						class="pixel-input w-full px-3 py-2.5 text-sm text-kraft-800"
						placeholder="At least 8 characters"
					/>
				</div>
				<div>
					<label for="confirmPassword" class="mb-1 block text-sm font-medium text-kraft-600"
						>Confirm Password</label
					>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						required
						minlength={8}
						class="pixel-input w-full px-3 py-2.5 text-sm text-kraft-800"
						placeholder="Repeat password"
					/>
				</div>
				<button type="submit" class="pixel-btn-primary w-full px-4 py-3 text-sm font-bold">
					Create Account
				</button>
			</form>
		{:else}
			<form method="POST" action="?/login" use:enhance class="space-y-4">
				<div>
					<label for="username" class="mb-1 block text-sm font-medium text-kraft-600"
						>Username</label
					>
					<input
						type="text"
						id="username"
						name="username"
						value={form?.username ?? ''}
						required
						class="pixel-input w-full px-3 py-2.5 text-sm text-kraft-800"
					/>
				</div>
				<div>
					<label for="password" class="mb-1 block text-sm font-medium text-kraft-600"
						>Password</label
					>
					<input
						type="password"
						id="password"
						name="password"
						required
						class="pixel-input w-full px-3 py-2.5 text-sm text-kraft-800"
					/>
				</div>
				<button type="submit" class="pixel-btn-primary w-full px-4 py-3 text-sm font-bold">
					Sign In
				</button>
			</form>
		{/if}
	</div>
</div>
