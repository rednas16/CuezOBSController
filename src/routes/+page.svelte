<script lang="ts">
	// Temporary page to exercise the store. The real UI comes in the next step.
	import { onMount, onDestroy } from 'svelte';
	import { obs } from '#lib/stores/obs.svelte.ts';

	onMount(() => obs.connect());
	onDestroy(() => obs.disconnect());
</script>

<main class="min-h-screen bg-[#0F1115] p-8 font-mono text-sm text-[#E8EAF0]">
	<h1 class="mb-4 text-2xl font-semibold">OBS Controller</h1>

	<p>stream: {obs.stream} · OBS: {obs.state.connection} {obs.state.obsVersion ?? ''}</p>
	<p>scene: {obs.state.currentScene} · scenes: {obs.state.scenes.join(', ')}</p>
	<p>
		recording: {obs.isRecording ? 'yes' : 'no'}
		{obs.state.recording.timecode} · {obs.state.recording.outputPath ?? '-'}
	</p>

	<div class="my-4 flex gap-2">
		<button
			class="rounded bg-red-600 px-3 py-2 disabled:opacity-40"
			disabled={!obs.canStart}
			onclick={() => obs.startRecording()}>Start</button
		>
		<button
			class="rounded bg-neutral-200 px-3 py-2 text-black disabled:opacity-40"
			disabled={!obs.canStop}
			onclick={() => obs.stopRecording()}>Stop</button
		>
		{#each obs.state.scenes as scene (scene)}
			<button
				class="rounded border border-neutral-600 px-3 py-2 disabled:opacity-40"
				class:bg-blue-900={scene === obs.state.currentScene}
				disabled={!obs.canSwitchScene}
				onclick={() => obs.setScene(scene)}>{scene}</button
			>
		{/each}
	</div>

	{#if obs.error}
		<p class="text-red-400">{obs.error.code}: {obs.error.message}</p>
	{/if}

	<ul class="mt-4 text-neutral-400">
		{#each obs.activity as entry (entry.at + entry.message)}
			<li>{entry.at.slice(11, 19)} {entry.message}</li>
		{/each}
	</ul>
</main>
