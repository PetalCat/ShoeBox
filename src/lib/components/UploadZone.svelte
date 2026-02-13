<script lang="ts">
	type UploadFile = {
		file: File;
		progress: number;
		status: 'pending' | 'uploading' | 'done' | 'error';
		error?: string;
	};

	let {
		eventSlug,
		token,
		open = $bindable(false),
		onComplete
	}: {
		eventSlug: string;
		token: string;
		open: boolean;
		onComplete: () => void;
	} = $props();

	let files = $state<UploadFile[]>([]);
	let uploaderName = $state('');
	let isDragOver = $state(false);
	let fileInput = $state<HTMLInputElement>(undefined!);

	function handleFiles(fileList: FileList | null) {
		if (!fileList) return;
		const newFiles: UploadFile[] = Array.from(fileList).map((f) => ({
			file: f,
			progress: 0,
			status: 'pending' as const
		}));
		files = [...files, ...newFiles];
		uploadAll();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		handleFiles(e.dataTransfer?.files ?? null);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function uploadAll() {
		for (let i = 0; i < files.length; i++) {
			if (files[i].status === 'pending') {
				uploadFile(i);
			}
		}
	}

	function uploadFile(index: number) {
		const entry = files[index];
		if (!entry || entry.status !== 'pending') return;

		files[index] = { ...entry, status: 'uploading' };

		const formData = new FormData();
		formData.append('file', entry.file);
		formData.append('uploaderName', uploaderName);

		const xhr = new XMLHttpRequest();
		xhr.open('POST', `/api/events/${eventSlug}/upload?t=${token}`);

		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) {
				files[index] = { ...files[index], progress: Math.round((e.loaded / e.total) * 100) };
			}
		};

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				files[index] = { ...files[index], status: 'done', progress: 100 };
			} else {
				let errorMsg = 'Upload failed';
				try {
					const resp = JSON.parse(xhr.responseText);
					errorMsg = resp.error || errorMsg;
				} catch {}
				files[index] = { ...files[index], status: 'error', error: errorMsg };
			}
			checkAllDone();
		};

		xhr.onerror = () => {
			files[index] = { ...files[index], status: 'error', error: 'Network error' };
			checkAllDone();
		};

		xhr.send(formData);
	}

	function checkAllDone() {
		if (files.every((f) => f.status === 'done' || f.status === 'error')) {
			const hasSuccess = files.some((f) => f.status === 'done');
			if (hasSuccess) {
				setTimeout(() => {
					onComplete();
				}, 500);
			}
		}
	}

	function close() {
		if (files.some((f) => f.status === 'uploading')) return;
		open = false;
		files = [];
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / 1048576).toFixed(1) + ' MB';
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
		onclick={close}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
		<div class="pixel-panel w-full max-w-lg p-6" onclick={(e) => e.stopPropagation()}>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-base font-bold text-kraft-700">Upload Photos & Videos</h2>
				<button
					onclick={close}
					aria-label="Close"
					class="text-kraft-400 transition hover:text-kraft-600"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="mb-4">
				<input
					type="text"
					bind:value={uploaderName}
					placeholder="Your name (optional)"
					class="pixel-input w-full px-3 py-2.5 text-sm text-kraft-800"
				/>
			</div>

			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="mb-4 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 transition {isDragOver
					? 'border-coral-500 bg-coral-500/5'
					: 'border-cream-300 bg-white hover:border-kraft-400'}"
				style="border-radius: 4px;"
				ondrop={handleDrop}
				ondragover={handleDragOver}
				ondragleave={() => (isDragOver = false)}
				onclick={() => fileInput.click()}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') fileInput.click();
				}}
			>
				<p class="mb-1 text-3xl">📷</p>
				<p class="text-sm font-medium text-kraft-600">Tap to select or drag & drop</p>
				<p class="text-xs text-kraft-400">Photos and videos</p>
			</div>

			<input
				type="file"
				bind:this={fileInput}
				multiple
				accept="image/*,video/*"
				class="hidden"
				onchange={(e) => handleFiles(e.currentTarget.files)}
			/>

			{#if files.length > 0}
				<div class="max-h-48 space-y-1.5 overflow-y-auto">
					{#each files as f}
						<div class="flex items-center gap-3 bg-white p-2" style="border-radius: 3px;">
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm text-kraft-700">{f.file.name}</p>
								<p class="text-xs text-kraft-400">{formatSize(f.file.size)}</p>
							</div>
							{#if f.status === 'uploading'}
								<div class="w-20">
									<div class="h-2 overflow-hidden bg-cream-200" style="border-radius: 2px;">
										<div
											class="h-full bg-coral-500 transition-all"
											style="width: {f.progress}%"
										></div>
									</div>
									<p class="mt-0.5 text-right text-xs text-kraft-400">{f.progress}%</p>
								</div>
							{:else if f.status === 'done'}
								<span class="text-sm font-bold text-green-600">Done</span>
							{:else if f.status === 'error'}
								<span class="text-xs text-coral-600" title={f.error}>Failed</span>
							{:else}
								<span class="text-xs text-kraft-400">Waiting...</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
