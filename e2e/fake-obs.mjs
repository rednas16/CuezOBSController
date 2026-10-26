/**
 * A fake OBS for end-to-end tests.
 *
 * It speaks just enough of the obs-websocket v5 protocol for this app:
 * the Hello/Identify handshake, the six requests we send, and the events
 * we listen to. Message shapes were copied from a real OBS 32.2.2 session
 * (see fixtures/obs-capture.json), so the app cannot tell the difference.
 *
 * Like real OBS it speaks both wire formats: JSON and msgpack, chosen by
 * the subprotocol the client asks for (obs-websocket-js defaults to msgpack).
 *
 * Besides the WebSocket (port 4466) it opens a tiny HTTP control port
 * (4467) that the tests use to poke OBS from the outside:
 *   POST /scene-created?name=Q%26A   a scene appears, as if added in OBS
 *   POST /drop                        OBS closes the connection
 *   POST /reset                       back to the initial state
 *
 * Run: node e2e/fake-obs.mjs   (Playwright starts it automatically)
 */
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { encode, decode } from '@msgpack/msgpack';

const WS_PORT = Number(process.env.FAKE_OBS_PORT ?? 4466);
const CONTROL_PORT = WS_PORT + 1;

// ---------------------------------------------------------------------------
// OBS state
// ---------------------------------------------------------------------------

const initialScenes = ['Intro', 'Talking head', 'Screen share'];
let scenes = [...initialScenes];
let currentScene = 'Intro';
let recording = { active: false, paused: false, startedAt: 0, path: null };

function reset() {
	scenes = [...initialScenes];
	currentScene = 'Intro';
	recording = { active: false, paused: false, startedAt: 0, path: null };
}

/** OBS lists scenes bottom-up: index 0 is the last one in its UI. */
function sceneList() {
	return [...scenes].reverse().map((sceneName, sceneIndex) => ({
		sceneIndex,
		sceneName,
		sceneUuid: `uuid-${sceneName}`
	}));
}

function recordStatus() {
	const ms = recording.active ? Date.now() - recording.startedAt : 0;
	const s = Math.floor(ms / 1000);
	const pad = (n) => String(n).padStart(2, '0');
	return {
		outputActive: recording.active,
		outputPaused: recording.paused,
		outputTimecode: `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}.${String(ms % 1000).padStart(3, '0')}`,
		outputDuration: ms,
		outputBytes: Math.floor(ms * 1200)
	};
}

// ---------------------------------------------------------------------------
// WebSocket protocol
// ---------------------------------------------------------------------------

const wss = new WebSocketServer({
	port: WS_PORT,
	handleProtocols: (protocols) =>
		protocols.has('obswebsocket.msgpack') ? 'obswebsocket.msgpack' : 'obswebsocket.json'
});
const clients = new Set();

const isMsgpack = (ws) => ws.protocol === 'obswebsocket.msgpack';

function send(ws, op, d) {
	if (ws.readyState !== ws.OPEN) return;
	const message = { op, d };
	ws.send(isMsgpack(ws) ? encode(message) : JSON.stringify(message));
}

function parse(ws, raw) {
	return isMsgpack(ws) ? decode(raw) : JSON.parse(raw.toString());
}

function broadcast(eventType, eventData) {
	for (const ws of clients) send(ws, 5, { eventType, eventIntent: 1, eventData });
}

/** Handle one request (op 6) and return its responseData. */
function handle(requestType, requestData) {
	switch (requestType) {
		case 'GetVersion':
			return { obsVersion: '32.2.2', obsWebSocketVersion: '5.7.4', rpcVersion: 1 };
		case 'GetSceneList':
			return {
				currentProgramSceneName: currentScene,
				currentProgramSceneUuid: `uuid-${currentScene}`,
				currentPreviewSceneName: null,
				currentPreviewSceneUuid: null,
				scenes: sceneList()
			};
		case 'GetRecordStatus':
			return recordStatus();
		case 'SetCurrentProgramScene': {
			const name = requestData?.sceneName;
			if (!scenes.includes(name)) throw { code: 600, comment: 'No source was found' };
			currentScene = name;
			broadcast('CurrentProgramSceneChanged', { sceneName: name, sceneUuid: `uuid-${name}` });
			return undefined;
		}
		case 'StartRecord': {
			if (recording.active) throw { code: 500, comment: 'The output is already running' };
			const stamp = new Date().toISOString().slice(0, 19).replace('T', ' ').replaceAll(':', '-');
			recording = {
				active: true,
				paused: false,
				startedAt: Date.now(),
				path: `/recordings/${stamp}.mov`
			};
			// Same two-step sequence as real OBS: STARTING without a path, STARTED with it.
			broadcast('RecordStateChanged', {
				outputActive: false,
				outputPath: null,
				outputState: 'OBS_WEBSOCKET_OUTPUT_STARTING'
			});
			broadcast('RecordStateChanged', {
				outputActive: true,
				outputPath: recording.path,
				outputState: 'OBS_WEBSOCKET_OUTPUT_STARTED'
			});
			return undefined;
		}
		case 'StopRecord': {
			if (!recording.active) throw { code: 501, comment: 'The output is not running' };
			const path = recording.path;
			recording = { active: false, paused: false, startedAt: 0, path };
			broadcast('RecordStateChanged', {
				outputActive: false,
				outputPath: null,
				outputState: 'OBS_WEBSOCKET_OUTPUT_STOPPING'
			});
			broadcast('RecordStateChanged', {
				outputActive: false,
				outputPath: path,
				outputState: 'OBS_WEBSOCKET_OUTPUT_STOPPED'
			});
			return { outputPath: path };
		}
		case 'PauseRecord':
			recording.paused = true;
			broadcast('RecordStateChanged', {
				outputActive: true,
				outputPath: null,
				outputState: 'OBS_WEBSOCKET_OUTPUT_PAUSED'
			});
			return undefined;
		case 'ResumeRecord':
			recording.paused = false;
			broadcast('RecordStateChanged', {
				outputActive: true,
				outputPath: null,
				outputState: 'OBS_WEBSOCKET_OUTPUT_RESUMED'
			});
			return undefined;
		default:
			throw { code: 204, comment: `Unknown request type ${requestType}` };
	}
}

wss.on('connection', (ws) => {
	// Hello (op 0). No `authentication` field means: no password needed.
	send(ws, 0, { obsStudioVersion: '32.2.2', obsWebSocketVersion: '5.7.4', rpcVersion: 1 });

	ws.on('message', (raw) => {
		const { op, d } = parse(ws, raw);
		if (op === 1) {
			// Identify -> Identified
			clients.add(ws);
			send(ws, 2, { negotiatedRpcVersion: 1 });
		} else if (op === 6) {
			// Request -> RequestResponse
			try {
				const responseData = handle(d.requestType, d.requestData);
				send(ws, 7, {
					requestType: d.requestType,
					requestId: d.requestId,
					requestStatus: { result: true, code: 100 },
					...(responseData !== undefined ? { responseData } : {})
				});
			} catch (err) {
				send(ws, 7, {
					requestType: d.requestType,
					requestId: d.requestId,
					requestStatus: {
						result: false,
						code: err.code ?? 205,
						comment: err.comment ?? String(err)
					}
				});
			}
		}
	});

	ws.on('close', () => clients.delete(ws));
});

// ---------------------------------------------------------------------------
// Control port for the tests
// ---------------------------------------------------------------------------

createServer((req, res) => {
	const url = new URL(req.url, 'http://localhost');
	if (url.pathname === '/scene-created') {
		const name = url.searchParams.get('name') ?? 'New scene';
		scenes.push(name);
		broadcast('SceneCreated', { sceneName: name, sceneUuid: `uuid-${name}`, isGroup: false });
		broadcast('SceneListChanged', { scenes: sceneList() });
	} else if (url.pathname === '/drop') {
		for (const ws of clients) ws.close(1001, 'OBS is shutting down');
	} else if (url.pathname === '/reset') {
		reset();
	}
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({ ok: true, scenes, currentScene, recording }));
}).listen(CONTROL_PORT);

console.log(`fake OBS: ws://localhost:${WS_PORT}  control: http://localhost:${CONTROL_PORT}`);
