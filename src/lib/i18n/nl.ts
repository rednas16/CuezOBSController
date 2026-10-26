/** Dutch copy. Must contain exactly the keys of `en.ts`. */
import type { MessageKey } from './en';

export const nl: Record<MessageKey, string> = {
	'app.title': 'OBS Controller',
	'app.subtitle': 'Studio-afstandsbediening',
	'lang.switch': 'Language: English',

	'status.connected': 'Verbonden',
	'status.connecting': 'Verbinden…',
	'status.disconnected': 'Niet verbonden',
	'status.serverUnreachable': 'Server onbereikbaar',

	'banner.connecting': 'Verbinden met OBS…',
	'banner.unreachable': 'OBS is niet bereikbaar',
	'banner.reason.unreachable':
		'OBS is niet bereikbaar op {url}. Controleer of OBS Studio draait en of de WebSocket-server aanstaat onder Tools › WebSocket Server Settings.',
	'banner.reason.auth':
		'OBS weigert het wachtwoord. Controleer OBS_WS_PASSWORD in het .env-bestand.',
	'banner.reason.lost': 'De verbinding met OBS is verbroken. Opnieuw verbinden…',
	'banner.reason.other': 'Onverwachte fout: {message}',
	'banner.controlsDisabled': 'De knoppen zijn uitgeschakeld tot de verbinding terug is.',

	'rec.title': 'Opname',
	'rec.idle': 'Inactief',
	'rec.unknown': 'Onbekend',
	'rec.badge': 'REC',
	'rec.paused': 'GEPAUZEERD',
	'rec.notRecording': 'Geen opname bezig',
	'rec.statusUnknown': 'Status onbekend',
	'rec.outputFile': 'Uitvoerbestand',
	'rec.noFile': '— geen actieve opname —',
	'rec.fileUnknown': 'Opname gestart in OBS voor deze app verbond; bestandsnaam onbekend.',
	'rec.start': 'Opname starten',
	'rec.inProgress': 'Bezig met opnemen…',
	'rec.stop': 'Opname stoppen',

	'scenes.title': 'Scènes',
	'scenes.available': '{n} beschikbaar',
	'scenes.program': 'Programmascène',
	'scenes.none': 'Geen scènes',
	'scenes.live': 'LIVE',
	'scenes.hint': 'De lijst wordt live bijgewerkt als scènes in OBS wijzigen.',

	'activity.title': 'Activiteit',
	'activity.empty': 'Nog niets.',
	'activity.connected': 'Verbonden met OBS {version}',
	'activity.connection_lost': 'Verbinding verbroken ({reason})',
	'activity.recording_started': 'Opname gestart · {file}',
	'activity.recording_stopped': 'Opname gestopt · {file}',
	'activity.scene_changed': 'Scène gewisseld naar “{scene}”',
	'activity.scene_list_changed': 'Scènelijst bijgewerkt',

	'toast.switched': 'Gewisseld naar {scene}',
	'toast.dismiss': 'Sluiten',

	'error.NOT_CONNECTED': 'Niet verbonden met OBS',
	'error.ALREADY_RECORDING': 'Er is al een opname bezig',
	'error.NOT_RECORDING': 'Er is geen opname om te stoppen',
	'error.UNKNOWN_SCENE': 'Die scène bestaat niet meer in OBS',
	'error.INVALID_REQUEST': 'Ongeldig verzoek',
	'error.OBS_ERROR': 'OBS meldde een fout',
	'error.NETWORK': 'De server is niet bereikbaar'
};
