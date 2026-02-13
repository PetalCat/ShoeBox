<script lang="ts">
	type Uploader = { name: string; count: number };

	type Filters = {
		kind?: string;
		uploader?: string;
		dateFrom?: string;
		dateTo?: string;
		sort?: string;
	};

	let {
		uploaders = [],
		filters = $bindable({})
	}: {
		uploaders?: Uploader[];
		filters?: Filters;
	} = $props();

	let kind = $state(filters.kind || '');
	let uploader = $state(filters.uploader || '');
	let dateFrom = $state(filters.dateFrom || '');
	let dateTo = $state(filters.dateTo || '');
	let sort = $state(filters.sort || 'newest');

	function emitFilters() {
		const f: Filters = { sort };
		if (kind) f.kind = kind;
		if (uploader) f.uploader = uploader;
		if (dateFrom) f.dateFrom = dateFrom;
		if (dateTo) f.dateTo = dateTo;
		filters = f;
	}

	function clearFilter(key: string) {
		if (key === 'kind') kind = '';
		if (key === 'uploader') uploader = '';
		if (key === 'dateFrom') dateFrom = '';
		if (key === 'dateTo') dateTo = '';
		emitFilters();
	}

	function clearAll() {
		kind = '';
		uploader = '';
		dateFrom = '';
		dateTo = '';
		sort = 'newest';
		emitFilters();
	}

	let activeFilters = $derived.by(() => {
		const chips: { key: string; label: string }[] = [];
		if (kind) chips.push({ key: 'kind', label: kind === 'image' ? 'Photos only' : 'Videos only' });
		if (uploader) chips.push({ key: 'uploader', label: `By: ${uploader || 'Anonymous'}` });
		if (dateFrom) chips.push({ key: 'dateFrom', label: `From: ${dateFrom}` });
		if (dateTo) chips.push({ key: 'dateTo', label: `To: ${dateTo}` });
		return chips;
	});
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center gap-2">
		<!-- Kind toggle -->
		<div class="flex border-2 border-kraft-600 bg-cream-200">
			{#each [{ value: '', label: 'All' }, { value: 'image', label: 'Photos' }, { value: 'video', label: 'Videos' }] as option}
				<button
					onclick={() => {
						kind = option.value;
						emitFilters();
					}}
					class="pixel-btn px-3 py-1.5 text-sm font-medium transition
						{kind === option.value ? 'bg-kraft-700 text-cream-100' : 'text-kraft-500 hover:bg-cream-300'}"
				>
					{option.label}
				</button>
			{/each}
		</div>

		<!-- Uploader dropdown -->
		{#if uploaders.length > 0}
			<select
				bind:value={uploader}
				onchange={emitFilters}
				class="pixel-border-light bg-cream-50 px-3 py-1.5 text-sm text-kraft-600 focus:border-coral-500 focus:outline-none"
			>
				<option value="">All uploaders</option>
				{#each uploaders as u}
					<option value={u.name}>{u.name || 'Anonymous'} ({u.count})</option>
				{/each}
			</select>
		{/if}

		<!-- Date range -->
		<div class="flex items-center gap-1">
			<input
				type="date"
				bind:value={dateFrom}
				onchange={emitFilters}
				class="pixel-border-light bg-cream-50 px-2 py-1.5 text-sm text-kraft-600 focus:border-coral-500 focus:outline-none"
			/>
			<span class="text-xs text-kraft-400">-</span>
			<input
				type="date"
				bind:value={dateTo}
				onchange={emitFilters}
				class="pixel-border-light bg-cream-50 px-2 py-1.5 text-sm text-kraft-600 focus:border-coral-500 focus:outline-none"
			/>
		</div>

		<!-- Sort dropdown -->
		<select
			bind:value={sort}
			onchange={emitFilters}
			class="pixel-border-light bg-cream-50 px-3 py-1.5 text-sm text-kraft-600 focus:border-coral-500 focus:outline-none"
		>
			<option value="newest">Newest first</option>
			<option value="oldest">Oldest first</option>
			<option value="largest">Largest first</option>
			<option value="smallest">Smallest first</option>
			<option value="uploader">By uploader</option>
		</select>
	</div>

	<!-- Active filter chips -->
	{#if activeFilters.length > 0}
		<div class="flex flex-wrap items-center gap-2">
			{#each activeFilters as chip}
				<button
					onclick={() => clearFilter(chip.key)}
					class="pixel-btn inline-flex items-center gap-1.5 border-2 border-coral-600 bg-coral-500/15 px-2.5 py-1 text-xs font-medium text-coral-700 hover:bg-coral-500/25"
				>
					{chip.label}
					<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			{/each}
			<button
				onclick={clearAll}
				class="text-xs font-medium text-kraft-400 transition hover:text-kraft-600"
			>
				Clear all
			</button>
		</div>
	{/if}
</div>
