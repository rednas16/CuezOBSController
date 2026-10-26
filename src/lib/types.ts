/**
 * Types shared by the server and the browser.
 *
 * This file contains only types, no code, so it is safe to import anywhere.
 * The server builds an `ObsState` from what OBS tells it; the browser
 * receives that same object through the API and the live event stream.
 */

/** Is the server currently connected to OBS? */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

/** Everything we know about the current recording. */
export interface RecordingState {
	/** True while OBS is recording. */
	active: boolean;
	/** True when the recording is paused (still "active" in OBS terms). */
	paused: boolean;
	/** Timecode as OBS formats it, e.g. "00:12:34.567". Empty when idle. */
	timecode: string;
	/** Duration of the current recording in milliseconds. */
	durationMs: number;
	/** Size written so far, in bytes. */
	bytes: number;
	/**
	 * Full path of the file being written, or null when unknown.
	 * OBS only reports the path in its start/stop events, so if this server
	 * started while OBS was already recording we do not know the name yet.
	 */
	outputPath: string | null;
}

/** The complete snapshot the UI needs to render itself. */
export interface ObsState {
	connection: ConnectionStatus;
	/** OBS Studio version, e.g. "31.1.1". Null until connected. */
	obsVersion: string | null;
	/** Address we are connecting to, shown in the UI for clarity. */
	obsUrl: string;
	/** Human readable reason (English) for the last connection problem, if any. */
	connectionError: string | null;
	/** Machine readable version of the above, so the UI can translate it. */
	connectionErrorKind: ConnectionErrorKind | null;
	recording: RecordingState;
	/** Names of all scenes, in the order OBS shows them. */
	scenes: string[];
	/** Name of the scene currently on program output. */
	currentScene: string | null;
}

/** Why the server cannot talk to OBS. */
export type ConnectionErrorKind = 'unreachable' | 'auth' | 'lost' | 'other';

/** What happened, for the activity log. The UI translates these. */
export type ActivityKind =
	| 'connected'
	| 'connection_lost'
	| 'recording_started'
	| 'recording_stopped'
	| 'recording_paused'
	| 'recording_resumed'
	| 'scene_changed'
	| 'scene_list_changed';

/** One line in the activity log shown in the UI. */
export interface ActivityEntry {
	/** ISO timestamp, e.g. "2026-10-23T18:14:02.000Z" */
	at: string;
	level: 'info' | 'warn' | 'error';
	kind: ActivityKind;
	/** Values to fill into the translated sentence, e.g. { scene: "Intro" }. */
	params: Record<string, string>;
	/** English fallback, also used in server logs. */
	message: string;
}

/**
 * Error codes the API can return. The UI translates these into
 * human readable, localised messages.
 */
export type ApiErrorCode =
	| 'NOT_CONNECTED'
	| 'ALREADY_RECORDING'
	| 'NOT_RECORDING'
	| 'ALREADY_PAUSED'
	| 'NOT_PAUSED'
	| 'PAUSE_UNSUPPORTED'
	| 'UNKNOWN_SCENE'
	| 'INVALID_REQUEST'
	| 'OBS_ERROR';

/** Shape of every error response from `/api/...`. */
export interface ApiError {
	error: {
		code: ApiErrorCode;
		message: string;
	};
}
