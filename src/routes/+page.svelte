<script lang="ts">
	/**
	 * The one and only page. It connects the store when it appears and lets
	 * the components render from it. On a phone the two columns stack.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { obs } from '#lib/stores/obs.svelte.ts';
	import { i18n, t } from '#lib/i18n/index.svelte.ts';
	import { formatTimecode } from '#lib/format.ts';
	import Header from '#lib/components/Header.svelte';
	import ConnectionBanner from '#lib/components/ConnectionBanner.svelte';
	import RecordingCard from '#lib/components/RecordingCard.svelte';
	import ScenesPanel from '#lib/components/ScenesPanel.svelte';
	import ActivityLog from '#lib/components/ActivityLog.svelte';
	import Toast from '#lib/components/Toast.svelte';

	onMount(() => {
		i18n.init();
		obs.connect();
	});

	// Keep the document language in sync for screen readers and spell checkers.
	$effect(() => {
		document.documentElement.lang = i18n.locale;
	});

	// While recording, the tab title shows the timecode, so the status is
	// visible even when the tab is in the background.
	const title = $derived(
		obs.isRecording
			? `● ${formatTimecode(obs.state.recording.timecode)} · ${t('app.title')}`
			: t('app.title')
	);
	onDestroy(() => obs.disconnect());
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-bg text-text">
	<Header />
	<ConnectionBanner />

	<main class="mx-auto flex w-full max-w-7xl flex-1 flex-wrap content-start gap-6 p-4 sm:p-8">
		<div class="min-w-0 flex-[999_1_560px]">
			<RecordingCard />
		</div>
		<div class="min-w-0 flex-[1_1_320px]">
			<ScenesPanel />
		</div>
		<div class="flex-[1_1_100%]">
			<ActivityLog />
		</div>
	</main>

	<Toast />
</div>
