<script lang="ts">
	/**
	 * Red banner shown when OBS cannot be reached. The server keeps retrying
	 * by itself; this only explains the situation to the person at the screen.
	 */
	import { obs } from '#lib/stores/obs.svelte.ts';

	const show = $derived(obs.stream === 'live' && !obs.connected);
</script>

{#if show}
	<div
		role="alert"
		class="mx-4 mt-6 flex flex-wrap items-start gap-3 rounded-xl border border-rec-line bg-rec-bg px-5 py-4 sm:mx-8"
	>
		<svg
			aria-hidden="true"
			class="mt-0.5 shrink-0 text-rec-soft"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
			<path d="M12 9v4" /><path d="M12 17h.01" />
		</svg>
		<div class="flex min-w-0 flex-col gap-1">
			<span class="text-sm font-semibold text-[#FFD3D5]">
				{obs.state.connection === 'connecting' ? 'Connecting to OBS…' : 'Can’t reach OBS'}
			</span>
			<span class="text-[13px] leading-relaxed text-[#E0A3A6]">
				{obs.state.connectionError ??
					'Make sure OBS Studio is running and the WebSocket server is enabled under Tools › WebSocket Server Settings.'}
				Controls are disabled until the connection is back.
			</span>
		</div>
	</div>
{/if}
