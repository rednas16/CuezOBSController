/**
 * The one and only connection between this server and OBS Studio.
 *
 * How it works, in short:
 *   1. `start()` opens a WebSocket to OBS and loads the initial state
 *      (version, scenes, recording status).
 *   2. OBS pushes events when something changes (recording started,
 *      scene switched, scene added...). We update `state` and notify
 *      listeners through `events`. The SSE route later forwards those
 *      notifications to the browser.
 *   3. While recording, we poll OBS once per second for the timecode,
 *      because OBS does not push that by itself.
 *   4. If the connection drops we retry with an increasing delay.
 *
 * The rest of the server only uses the exported functions at the bottom
 * of this file (`getState`, `startRecording`, ...). Nothing else touches
 * the OBS socket directly.
 */
import { EventEmitter } from 'node:events';
import OBSWebSocket from 'obs-websocket-js';
import { config } from './config';
import { log } from './logger';
import { ObsError, toObsError } from './errors';
import type { ActivityEntry, ActivityKind, ConnectionErrorKind, ObsState } from '#lib/types.ts';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const obs = new OBSWebSocket();

/** Current snapshot. Mutated in place, then broadcast with `publish()`. */
const state: ObsState = {
	connection: 'disconnected',
	obsVersion: null,
	obsUrl: config.obsUrl,
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

/** Recent activity lines, newest last. Kept short; this is a UI log, not an audit trail. */
const activity: ActivityEntry[] = [];
const MAX_ACTIVITY = 50;

/**
 * Listeners subscribe here. Two events are emitted:
 *   'state'    -> the full ObsState after any change
 *   'activity' -> one new ActivityEntry
 * Sending the whole state every time is simple and the object is tiny.
 */
export const events = new EventEmitter();
events.setMaxListeners(100); // one listener per open browser tab

/** Notify listeners that `state` changed. */
function publish() {
	events.emit('state', getState());
}

/** Add a line to the activity log and tell listeners about it. */
function addActivity(
	level: ActivityEntry['level'],
	kind: ActivityKind,
	params: Record<string, string>,
	message: string
) {
	const entry: ActivityEntry = { at: new Date().toISOString(), level, kind, params, message };
	activity.push(entry);
	if (activity.length > MAX_ACTIVITY) activity.shift();
	events.emit('activity', entry);
}

// ---------------------------------------------------------------------------
// Connecting and reconnecting
// ---------------------------------------------------------------------------

let started = false;
let reconnectAttempt = 0;
let reconnectTimer: NodeJS.Timeout | null = null;

/** Delay before the next reconnect: 1s, 2s, 4s, 8s, then 15s forever. */
export function reconnectDelayMs(attempt: number): number {
	return Math.min(1000 * 2 ** attempt, 15_000);
}

/**
 * Start the connection loop. Safe to call more than once; only the first
 * call does anything. Called from `hooks.server.ts` when the server boots.
 */
export function start() {
	if (started) return;
	started = true;
	registerObsEventHandlers();
	void connect();
}

async function connect() {
	state.connection = 'connecting';
	publish();
	log.info({ url: config.obsUrl }, 'connecting to OBS');

	try {
		// `connect` performs the handshake including password authentication.
		// We only subscribe to the events we handle (see registerObsEventHandlers).
		await obs.connect(config.obsUrl, config.obsPassword || undefined);
		await loadInitialState();

		reconnectAttempt = 0;
		state.connection = 'connected';
		state.connectionError = null;
		state.connectionErrorKind = null;
		publish();
		addActivity(
			'info',
			'connected',
			{ version: state.obsVersion ?? '' },
			`Connected to OBS ${state.obsVersion}`
		);
		log.info({ version: state.obsVersion }, 'connected to OBS');
	} catch (err) {
		const { kind, message } = describeConnectError(err);
		state.connection = 'disconnected';
		state.connectionError = message;
		state.connectionErrorKind = kind;
		publish();
		log.warn({ err: message, attempt: reconnectAttempt }, 'could not connect to OBS');
		scheduleReconnect();
	}
}

/** Ask OBS for everything we need to render the UI the first time. */
async function loadInitialState() {
	const version = await obs.call('GetVersion');
	state.obsVersion = version.obsVersion;

	const sceneList = await obs.call('GetSceneList');
	state.scenes = sceneNamesFrom(sceneList.scenes);
	state.currentScene = sceneList.currentProgramSceneName ?? null;

	await refreshRecordingStatus();
	// The file name is only reported in events, so if OBS was already
	// recording before we connected we cannot know it. Leave it null.
	if (state.recording.active) startTimecodePolling();
}

function scheduleReconnect() {
	if (reconnectTimer) return;
	const delay = reconnectDelayMs(reconnectAttempt);
	reconnectAttempt += 1;
	reconnectTimer = setTimeout(() => {
		reconnectTimer = null;
		void connect();
	}, delay);
}

/** Classify connection errors so the UI can explain them in its own language. */
function describeConnectError(err: unknown): { kind: ConnectionErrorKind; message: string } {
	const message = err instanceof Error ? err.message : String(err);
	// A refused connection arrives with an empty message or a network error code.
	if (message === '' || /ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT/.test(message)) {
		return {
			kind: 'unreachable',
			message: `OBS is not reachable at ${config.obsUrl}. Is OBS running with the WebSocket server enabled?`
		};
	}
	if (/auth/i.test(message)) {
		return { kind: 'auth', message: 'OBS rejected the password. Check OBS_WS_PASSWORD in .env.' };
	}
	return { kind: 'other', message };
}

// ---------------------------------------------------------------------------
// Events pushed by OBS
// ---------------------------------------------------------------------------

function registerObsEventHandlers() {
	// Fired when the socket closes for any reason (OBS quit, network issue...).
	obs.on('ConnectionClosed', (err) => {
		// While connecting, a failed handshake also fires this event; the
		// catch block in connect() already handles that case.
		if (state.connection !== 'connected') return;
		state.connection = 'disconnected';
		state.connectionError = 'Connection to OBS was lost. Reconnecting…';
		state.connectionErrorKind = 'lost';
		stopTimecodePolling();
		publish();
		const reason = err?.message ?? 'closed';
		addActivity('warn', 'connection_lost', { reason }, `Connection lost (${reason})`);
		log.warn({ err: err?.message }, 'OBS connection closed');
		scheduleReconnect();
	});

	// Recording started, stopped, paused or resumed.
	obs.on('RecordStateChanged', (data) => {
		log.debug(data, 'RecordStateChanged');
		const wasActive = state.recording.active;
		state.recording.active = data.outputActive;
		state.recording.paused = data.outputState === 'OBS_WEBSOCKET_OUTPUT_PAUSED';

		// OBS includes the file path when a recording starts and when it stops.
		if (data.outputPath) state.recording.outputPath = data.outputPath;

		if (data.outputActive && !wasActive) {
			startTimecodePolling();
			const file = fileName(state.recording.outputPath);
			addActivity('info', 'recording_started', { file }, `Recording started · ${file}`);
		} else if (!data.outputActive && wasActive) {
			stopTimecodePolling();
			const file = fileName(state.recording.outputPath);
			addActivity('info', 'recording_stopped', { file }, `Recording stopped · ${file}`);
			state.recording.timecode = '';
			state.recording.durationMs = 0;
			state.recording.bytes = 0;
		}
		publish();
	});

	// Someone switched scenes, in OBS itself or through this app.
	obs.on('CurrentProgramSceneChanged', (data) => {
		state.currentScene = data.sceneName;
		publish();
		addActivity(
			'info',
			'scene_changed',
			{ scene: data.sceneName },
			`Scene changed to “${data.sceneName}”`
		);
	});

	// Scenes were added, removed, renamed or reordered in OBS.
	obs.on('SceneListChanged', (data) => {
		state.scenes = sceneNamesFrom(data.scenes);
		publish();
		addActivity('info', 'scene_list_changed', {}, 'Scene list updated');
	});
}

/** OBS sends scenes as loose JSON objects; pull out just the names. */
function sceneNamesFrom(scenes: Array<Record<string, unknown>>): string[] {
	// OBS lists scenes bottom-up (sceneIndex 0 is the last one in its UI),
	// so we reverse to match what the user sees in OBS.
	return scenes.map((s) => String(s.sceneName)).reverse();
}

/** Just the file name part of a path, for log lines. */
function fileName(path: string | null): string {
	if (!path) return '?';
	return path.split(/[\\/]/).pop() ?? path;
}

// ---------------------------------------------------------------------------
// Timecode polling (OBS has no "tick" event)
// ---------------------------------------------------------------------------

let pollTimer: NodeJS.Timeout | null = null;

function startTimecodePolling() {
	if (pollTimer) return;
	pollTimer = setInterval(async () => {
		try {
			await refreshRecordingStatus();
			publish();
		} catch (err) {
			log.debug({ err: String(err) }, 'timecode poll failed');
		}
	}, 1000);
}

function stopTimecodePolling() {
	if (!pollTimer) return;
	clearInterval(pollTimer);
	pollTimer = null;
}

async function refreshRecordingStatus() {
	const status = await obs.call('GetRecordStatus');
	state.recording.active = status.outputActive;
	state.recording.paused = status.outputPaused;
	state.recording.timecode = status.outputTimecode;
	state.recording.durationMs = status.outputDuration;
	state.recording.bytes = status.outputBytes;
}

// ---------------------------------------------------------------------------
// Public API used by the routes
// ---------------------------------------------------------------------------

/** A copy of the current state (so callers cannot mutate ours). */
export function getState(): ObsState {
	return structuredClone(state);
}

/** The recent activity log, oldest first. */
export function getActivity(): ActivityEntry[] {
	return [...activity];
}

function assertConnected() {
	if (state.connection !== 'connected') {
		throw new ObsError('NOT_CONNECTED', state.connectionError ?? 'Not connected to OBS');
	}
}

export async function startRecording(): Promise<void> {
	assertConnected();
	if (state.recording.active) {
		throw new ObsError('ALREADY_RECORDING', 'A recording is already in progress');
	}
	try {
		await obs.call('StartRecord');
		// The RecordStateChanged event updates `state` and notifies listeners.
	} catch (err) {
		throw toObsError(err);
	}
}

export async function stopRecording(): Promise<{ outputPath: string }> {
	assertConnected();
	if (!state.recording.active) {
		throw new ObsError('NOT_RECORDING', 'There is no recording to stop');
	}
	try {
		const result = await obs.call('StopRecord');
		state.recording.outputPath = result.outputPath;
		return { outputPath: result.outputPath };
	} catch (err) {
		throw toObsError(err);
	}
}

export async function setCurrentScene(sceneName: string): Promise<void> {
	assertConnected();
	if (!state.scenes.includes(sceneName)) {
		throw new ObsError('UNKNOWN_SCENE', `Scene “${sceneName}” does not exist in OBS`);
	}
	try {
		await obs.call('SetCurrentProgramScene', { sceneName });
		// The CurrentProgramSceneChanged event updates `state`.
	} catch (err) {
		throw toObsError(err);
	}
}
