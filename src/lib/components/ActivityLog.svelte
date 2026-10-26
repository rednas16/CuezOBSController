<script lang="ts">
	/** Recent events, newest on top. Fed by the server's activity log. */
	import { obs } from '#lib/stores/obs.svelte.ts';
	import { formatTime } from '#lib/format.ts';

	// Newest first reads better in a log that grows while you watch.
	const entries = $derived(obs.activity.slice().reverse());
</script>

<section class="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface px-6 py-5 sm:px-7">
	<h2 class="text-[13px] font-semibold tracking-wider text-muted uppercase">Activity</h2>
	{#if entries.length === 0}
		<p class="font-mono text-[13px] text-dim">Nothing yet.</p>
	{:else}
		<ol class="flex max-h-56 flex-col gap-1.5 overflow-y-auto font-mono text-[13px]">
			{#each entries as entry (entry.at + entry.message)}
				<li
					class="flex gap-4 {entry.level === 'error'
						? 'text-rec-soft'
						: entry.level === 'warn'
							? 'text-[#F5C26B]'
							: 'text-[#B3BBC9]'}"
				>
					<time class="shrink-0 text-dim" datetime={entry.at}>{formatTime(entry.at)}</time>
					<span>{entry.message}</span>
				</li>
			{/each}
		</ol>
	{/if}
</section>
