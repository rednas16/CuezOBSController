/**
 * The browser-side store: everything the UI knows about OBS.
 *
 * This is a `.svelte.ts` file, so Svelte 5 runes ($state, $derived) work
 * here outside of a component. Components import the single `obs` instance
 * and read its fields; Svelte re-renders them when a field changes.
 *
 * Where the data comes from:
 *   1. `connect()` fetches /api/status once for the first picture, then
 *      opens an EventSource on /api/events. The server pushes a new
 *      snapshot on every change, so the UI never polls.
 *   2. The action methods (startRecording, stopRecording, setScene) call
 *      the API. They do not update `state` themselves: the server sends the
 *      confirmed new state over the stream, so the UI always shows what OBS
 *      really did, even when someone presses record in OBS itself.
 */
import type { ActivityEntry, ApiError, ApiErrorCode, ObsState } from '#lib/types.ts';

/** What the UI shows before the first answer from the server arrives. */
const initialState: ObsState = {
	connection: 'connecting',
	obsVersion: null,
	obsUrl: '',
	connectionError: null,
	connectionErrorKind: null,
	recording: {
		active: false,
		paused: false,
		timecode: '',
		durationMs: 0,
		bytes: 0,
		outputPath: null
	},
	scenes: [],
	currentScene: null
};

/** Is the browser's live stream to our server up? */
export type StreamStatus = 'connecting' | 'live' | 'offline';

/** An error we want to show the user, usually from an API call. */
export interface UiError {
	code: ApiErrorCode | 'NETWORK';
	message: string;
}

class ObsStore {
	/** Latest snapshot from the server. */
	state = $state<ObsState>(initialState);
	/** Activity log lines, oldest first. */
	activity = $state<ActivityEntry[]>([]);
	/** Status of the SSE stream between browser and our server. */
	stream = $state<StreamStatus>('connecting');
	/** True while an action request is in flight (disables the buttons). */
	busy = $state(false);
	/** Last error to show the user; null when there is none. */
	error = $state<UiError | null>(null);

	// Derived values keep the templates free of logic.
	connected = $derived(this.state.connection === 'connected');
	isRecording = $derived(this.state.recording.active);
	canStart = $derived(this.connected && !this.isRecording && !this.busy);
	canStop = $derived(this.connected && this.isRecording && !this.busy);
	isPaused = $derived(this.state.recording.paused);
	canPause = $derived(this.canStop && !this.isPaused);
	canResume = $derived(this.canStop && this.isPaused);
	canSwitchScene = $derived(this.connected && !this.busy);

	private source: EventSource | null = null;

	/**
	 * Load the first snapshot and start listening for live updates.
	 * Call once from the page's onMount. Safe to call again; it reconnects.
	 */
	async connect() {
		this.disconnect();

		try {
			const res = await fetch('/api/status');
			const data = (await res.json()) as { state: ObsState; activity: ActivityEntry[] };
			this.state = data.state;
			this.activity = data.activity;
		} catch {
			// Not fatal: the stream below delivers the same data once it is up.
		}

		const source = new EventSource('/api/events');
		this.source = source;

		source.onopen = () => {
			this.stream = 'live';
			// The server replays the whole log on (re)connect, so start clean
			// to avoid duplicate lines.
			this.activity = [];
		};

		// EventSource reconnects by itself; we only reflect the status.
		source.onerror = () => {
			this.stream = 'offline';
		};

		source.addEventListener('state', (event) => {
			this.state = JSON.parse(event.data) as ObsState;
		});

		source.addEventListener('activity', (event) => {
			const entry = JSON.parse(event.data) as ActivityEntry;
			this.activity = [...this.activity, entry].slice(-50);
		});
	}

	/** Stop listening. Call from the page's onDestroy. */
	disconnect() {
		this.source?.close();
		this.source = null;
	}

	startRecording() {
		return this.post('/api/recording/start');
	}

	pauseRecording() {
		return this.post('/api/recording/pause');
	}

	resumeRecording() {
		return this.post('/api/recording/resume');
	}

	stopRecording() {
		return this.post('/api/recording/stop');
	}

	setScene(sceneName: string) {
		return this.post('/api/scenes/current', { sceneName });
	}

	/** Forget the current error (e.g. when the user dismisses the toast). */
	clearError() {
		this.error = null;
	}

	/**
	 * Send one action to the API. Resolves to true on success.
	 * On failure the error is stored in `error` for the UI to display.
	 *
	 * Every request is sent as JSON, even without a body. SvelteKit's CSRF
	 * protection only lets form-like POSTs through when the Origin matches
	 * exactly; JSON requests are exempt because a cross-site form cannot
	 * produce them.
	 */
	private async post(url: string, body: object = {}): Promise<boolean> {
		this.busy = true;
		this.error = null;
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				this.error = await readError(res);
				return false;
			}
			return true;
		} catch (err) {
			this.error = { code: 'NETWORK', message: err instanceof Error ? err.message : String(err) };
			return false;
		} finally {
			this.busy = false;
		}
	}
}

/** Read an error response; falls back to plain text when it is not our JSON shape. */
async function readError(res: Response): Promise<UiError> {
	const text = await res.text();
	try {
		const data = JSON.parse(text) as ApiError;
		if (data.error?.code) return data.error;
	} catch {
		// not JSON
	}
	return { code: 'NETWORK', message: text || `HTTP ${res.status}` };
}

/** The one shared store instance. */
export const obs = new ObsStore();
