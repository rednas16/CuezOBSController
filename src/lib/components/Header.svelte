<script lang="ts">
	/**
	 * Top bar: app name, language switch and the connection badge.
	 * The badge reflects two links: browser -> our server (stream) and
	 * our server -> OBS (connection). Both must be up to be "Connected".
	 */
	import { obs } from '#lib/stores/obs.svelte.ts';
	import { i18n, t } from '#lib/i18n/index.svelte.ts';

	const label = $derived(
		obs.stream !== 'live'
			? t('status.serverUnreachable')
			: obs.state.connection === 'connected'
				? t('status.connected')
				: obs.state.connection === 'connecting'
					? t('status.connecting')
					: t('status.disconnected')
	);
	const ok = $derived(obs.stream === 'live' && obs.connected);
</script>

<header
	class="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-[#12151B] px-4 py-4 sm:px-8"
>
	<div class="flex items-center gap-3">
		<div
			class="flex size-8 items-center justify-center rounded-lg border border-line-strong bg-surface-2"
		>
			<svg
				aria-hidden="true"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="9" />
				<circle cx="12" cy="12" r="3" />
			</svg>
		</div>
		<div class="flex flex-col">
			<span class="text-[15px] font-semibold tracking-tight">{t('app.title')}</span>
			<span class="text-xs text-muted">{t('app.subtitle')}</span>
		</div>
	</div>

	<div class="flex items-center gap-3">
		<button
			type="button"
			class="h-9 rounded-full border border-line px-3 text-xs font-semibold tracking-wider text-muted uppercase transition hover:border-line-strong hover:text-text"
			aria-label={t('lang.switch')}
			title={t('lang.switch')}
			onclick={() => i18n.toggle()}
		>
			{i18n.locale === 'en' ? 'NL' : 'EN'}
		</button>

		<div
			class="flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-[13px]
				{ok ? 'border-ok-line bg-ok-bg text-ok-soft' : 'border-rec-line bg-rec-bg text-rec-soft'}"
			role="status"
		>
			<span class="size-2 rounded-full {ok ? 'bg-ok' : 'bg-rec'}"></span>
			<span class="font-medium">{label}</span>
			{#if ok}
				<span class="hidden font-mono text-xs text-[#6FB58F] sm:inline">
					OBS {obs.state.obsVersion} · {obs.state.obsUrl}
				</span>
			{/if}
		</div>
	</div>
</header>
