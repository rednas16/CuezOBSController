/**
 * English copy. This file defines the set of keys; `nl.ts` must provide the
 * same keys (TypeScript checks that). Words in curly braces are filled in
 * at runtime, e.g. t('toast.switched', { scene: 'Intro' }).
 */
export const en = {
	'app.title': 'OBS Controller',
	'app.subtitle': 'Studio remote',
	'lang.switch': 'Taal: Nederlands',

	'status.connected': 'Connected',
	'status.connecting': 'Connecting…',
	'status.disconnected': 'Disconnected',
	'status.serverUnreachable': 'Server unreachable',

	'banner.connecting': 'Connecting to OBS…',
	'banner.unreachable': 'Can’t reach OBS',
	'banner.reason.unreachable':
		'OBS is not reachable at {url}. Make sure OBS Studio is running and the WebSocket server is enabled under Tools › WebSocket Server Settings.',
	'banner.reason.auth': 'OBS rejected the password. Check OBS_WS_PASSWORD in the .env file.',
	'banner.reason.lost': 'The connection to OBS was lost. Reconnecting…',
	'banner.reason.other': 'Unexpected error: {message}',
	'banner.controlsDisabled': 'Controls are disabled until the connection is back.',

	'rec.title': 'Recording',
	'rec.idle': 'Idle',
	'rec.unknown': 'Unknown',
	'rec.badge': 'REC',
	'rec.paused': 'PAUSED',
	'rec.notRecording': 'Not recording',
	'rec.statusUnknown': 'Status unknown',
	'rec.outputFile': 'Output file',
	'rec.noFile': '— no active recording —',
	'rec.fileUnknown': 'Recording started in OBS before this app connected; file name unknown.',
	'rec.start': 'Start recording',
	'rec.inProgress': 'Recording…',
	'rec.stop': 'Stop recording',
	'rec.pause': 'Pause',
	'rec.resume': 'Resume',

	'scenes.title': 'Scenes',
	'scenes.available': '{n} available',
	'scenes.program': 'Program scene',
	'scenes.none': 'No scenes',
	'scenes.live': 'LIVE',
	'scenes.hint': 'List updates live when scenes change in OBS.',

	'activity.title': 'Activity',
	'activity.empty': 'Nothing yet.',
	'activity.connected': 'Connected to OBS {version}',
	'activity.connection_lost': 'Connection lost ({reason})',
	'activity.recording_started': 'Recording started · {file}',
	'activity.recording_stopped': 'Recording stopped · {file}',
	'activity.recording_paused': 'Recording paused',
	'activity.recording_resumed': 'Recording resumed',
	'activity.scene_changed': 'Scene changed to “{scene}”',
	'activity.scene_list_changed': 'Scene list updated',

	'toast.switched': 'Switched to {scene}',
	'toast.dismiss': 'Dismiss',

	'error.NOT_CONNECTED': 'Not connected to OBS',
	'error.ALREADY_RECORDING': 'A recording is already in progress',
	'error.NOT_RECORDING': 'There is no recording to stop',
	'error.ALREADY_PAUSED': 'The recording is already paused',
	'error.NOT_PAUSED': 'The recording is not paused',
	'error.PAUSE_UNSUPPORTED': 'OBS cannot pause with its current output settings',
	'error.UNKNOWN_SCENE': 'That scene no longer exists in OBS',
	'error.INVALID_REQUEST': 'Invalid request',
	'error.OBS_ERROR': 'OBS reported an error',
	'error.NETWORK': 'Could not reach the server'
} as const;

export type MessageKey = keyof typeof en;
