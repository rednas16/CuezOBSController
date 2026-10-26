<script lang="ts">
	/**
	 * Bottom-right notifications: errors from the store, and short
	 * confirmations (e.g. "Switched to Intro") that disappear by themselves.
	 */
	import { obs } from '#lib/stores/obs.svelte.ts';

	let notice = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Confirm scene switches: show a notice whenever the current scene changes
	// after the first load.
	let lastScene = $state<string | null | undefined>(undefined);
	$effect(() => {
		const scene = obs.state.currentScene;
		if (lastScene !== undefined && scene && scene !== lastScene) {
			notice = `Switched to ${scene}`;
			clearTimeout(timer);
			timer = setTimeout(() => (notice = null), 3000);
		}
		lastScene = scene;
	});
</script>

<div
	class="pointer-events-none fixed right-4 bottom-4 z-10 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6"
>
	{#if obs.error}
		<div
			role="alert"
			class="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border border-rec-line bg-rec-bg px-4 py-3 text-[13px] text-[#FFD3D5] shadow-2xl"
		>
			<span class="flex-1">
				<strong class="font-semibold">{obs.error.code.replaceAll('_', ' ')}</strong>
				<br />{obs.error.message}
			</span>
			<button
				type="button"
				class="-m-1 rounded p-1 text-rec-soft hover:text-white"
				aria-label="Dismiss"
				onclick={() => obs.clearError()}
			>
				<svg
					aria-hidden="true"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/if}

	{#if notice}
		<div
			role="status"
			class="flex items-center gap-3 rounded-xl border border-ok-line bg-ok-bg px-4 py-3 text-[13px] text-[#C9F2DC] shadow-2xl"
		>
			<svg
				aria-hidden="true"
				class="text-ok"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M20 6 9 17l-5-5" />
			</svg>
			<span>{notice}</span>
		</div>
	{/if}
</div>
