<script lang="ts">
	/**
	 * Scene switching: a dropdown (the assignment's bonus) plus one button per
	 * scene for quick access. Both call the same store method.
	 *
	 * The list comes from OBS and updates live when scenes are added,
	 * removed or renamed there.
	 */
	import { obs } from '#lib/stores/obs.svelte.ts';
	import { t } from '#lib/i18n/index.svelte.ts';

	const scenes = $derived(obs.state.scenes);
	const current = $derived(obs.state.currentScene);

	function onSelect(event: Event) {
		const name = (event.currentTarget as HTMLSelectElement).value;
		if (name && name !== current) obs.setScene(name);
	}
</script>

<aside class="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 sm:p-7">
	<div class="flex items-center justify-between gap-3">
		<h2 class="text-[13px] font-semibold tracking-wider text-muted uppercase">
			{t('scenes.title')}
		</h2>
		<span class="text-xs text-dim">{t('scenes.available', { n: scenes.length })}</span>
	</div>

	<label for="scene-select" class="text-xs text-muted">{t('scenes.program')}</label>
	<div class="relative -mt-2">
		<select
			id="scene-select"
			class="h-11 w-full appearance-none rounded-[10px] border border-line-strong bg-bg pr-10 pl-3.5 text-sm font-medium text-text
				disabled:cursor-not-allowed disabled:text-muted"
			disabled={!obs.canSwitchScene || scenes.length === 0}
			value={current ?? ''}
			onchange={onSelect}
		>
			{#if scenes.length === 0}
				<option value="">{t('scenes.none')}</option>
			{/if}
			{#each scenes as scene (scene)}
				<option value={scene}>{scene}</option>
			{/each}
		</select>
		<svg
			aria-hidden="true"
			class="pointer-events-none absolute top-3.5 right-3.5 text-muted"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</div>

	<div class="mt-2 flex flex-col gap-1.5">
		{#each scenes as scene (scene)}
			{@const active = scene === current}
			<button
				type="button"
				class="flex h-11 items-center justify-between rounded-[10px] border px-3.5 text-left text-sm transition
					disabled:cursor-not-allowed disabled:opacity-50
					{active
					? 'border-live-line bg-live-bg font-semibold text-white'
					: 'border-line text-text-soft hover:border-line-strong hover:bg-surface-2'}"
				aria-current={active ? 'true' : undefined}
				disabled={!obs.canSwitchScene || active}
				onclick={() => obs.setScene(scene)}
			>
				<span class="truncate">{scene}</span>
				{#if active}
					<span class="text-[11px] tracking-wider text-live">{t('scenes.live')}</span>
				{/if}
			</button>
		{/each}
	</div>

	<p class="mt-1 text-xs leading-relaxed text-dim">{t('scenes.hint')}</p>
</aside>
