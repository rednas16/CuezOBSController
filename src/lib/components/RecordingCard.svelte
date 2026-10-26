<script lang="ts">
	/**
	 * The main card: recording status, timecode, output file and the
	 * start/stop buttons. Turns red while recording.
	 */
	import { obs } from '#lib/stores/obs.svelte.ts';
	import { t } from '#lib/i18n/index.svelte.ts';
	import { formatTimecode, formatBytes } from '#lib/format.ts';

	const rec = $derived(obs.state.recording);
	const recording = $derived(obs.isRecording);
</script>

<section
	class="flex flex-col gap-5 rounded-2xl border p-6 sm:p-7
		{recording
		? 'border-rec-line bg-rec-bg shadow-[0_0_0_4px_rgba(229,72,77,0.08)]'
		: 'border-line bg-surface'}"
>
	<div class="flex items-center justify-between gap-3">
		<h2 class="text-[13px] font-semibold tracking-wider text-muted uppercase">{t('rec.title')}</h2>
		{#if recording}
			<span
				class="flex items-center gap-2 rounded-full bg-[#3A1518] px-2.5 py-1 text-xs font-semibold tracking-wider text-rec-soft"
			>
				<span class="size-2 animate-pulse rounded-full bg-rec"></span>
				{rec.paused ? t('rec.paused') : t('rec.badge')}
			</span>
		{:else}
			<span class="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
				{obs.connected ? t('rec.idle') : t('rec.unknown')}
			</span>
		{/if}
	</div>

	<div class="flex flex-wrap items-baseline gap-4">
		<span
			class="font-mono text-5xl leading-none font-medium tracking-tight tabular-nums sm:text-6xl
				{recording ? 'text-white' : 'text-[#4B5261]'}"
		>
			{obs.connected ? formatTimecode(rec.timecode) : '--:--:--'}
		</span>
		<span class="text-sm text-muted">
			{#if recording}
				{formatBytes(rec.bytes)}
			{:else if obs.connected}
				{t('rec.notRecording')}
			{:else}
				{t('rec.statusUnknown')}
			{/if}
		</span>
	</div>

	<div class="flex flex-col gap-1.5 rounded-[10px] border border-line bg-bg px-4 py-3.5">
		<span class="text-xs text-muted">{t('rec.outputFile')}</span>
		{#if rec.outputPath}
			<span class="font-mono text-sm break-all {recording ? 'text-text' : 'text-text-soft'}">
				{rec.outputPath}
			</span>
		{:else if recording}
			<span class="font-mono text-sm text-muted">{t('rec.fileUnknown')}</span>
		{:else}
			<span class="font-mono text-sm text-dim">{t('rec.noFile')}</span>
		{/if}
	</div>

	<div class="mt-1 flex flex-wrap gap-3">
		<button
			type="button"
			class="flex h-14 flex-[1_1_220px] items-center justify-center gap-2.5 rounded-xl bg-rec text-base font-semibold text-white transition
				hover:bg-[#f0585d] disabled:cursor-not-allowed disabled:border disabled:border-line disabled:bg-transparent disabled:text-[#5A6271]"
			disabled={!obs.canStart}
			onclick={() => obs.startRecording()}
		>
			<span class="size-3 rounded-full bg-current"></span>
			{recording ? t('rec.inProgress') : t('rec.start')}
		</button>
		<button
			type="button"
			class="flex h-14 flex-[1_1_220px] items-center justify-center gap-2.5 rounded-xl bg-text text-base font-semibold text-bg transition
				hover:bg-white disabled:cursor-not-allowed disabled:border disabled:border-line disabled:bg-transparent disabled:text-[#5A6271]"
			disabled={!obs.canStop}
			onclick={() => obs.stopRecording()}
		>
			<span class="size-3 rounded-sm bg-current"></span>
			{t('rec.stop')}
		</button>
	</div>
</section>
