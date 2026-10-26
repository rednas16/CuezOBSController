<script lang="ts">
	/**
	 * Bottom-right notifications: errors from the store, and short
	 * confirmations (e.g. "Switched to Intro") that disappear by themselves.
	 */
	import { obs } from '#lib/stores/obs.svelte.ts';
	import { t } from '#lib/i18n/index.svelte.ts';

	let notice = $state<string | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Confirm scene switches: show a notice when the current scene changes from
	// one known scene to another. The first scene we learn about is not a switch.
	let lastScene = $state<string | null>(null);
	$effect(() => {
		const scene = obs.state.currentScene;
		if (lastScene && scene && scene !== lastScene) {
			notice = t('toast.switched', { scene });
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
				<strong class="font-semibold">{t(`error.${obs.error.code}`)}</strong>
				<br /><span class="text-[#E0A3A6]">{obs.error.message}</span>
			</span>
			<button
				type="button"
				class="-m-1 rounded p-1 text-rec-soft hover:text-white"
				aria-label={t('toast.dismiss')}
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
