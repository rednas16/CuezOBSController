/**
 * Tests for the browser store. `fetch` and `EventSource` are replaced by
 * small fakes so we can feed the store exactly the data we want and check
 * how the derived flags react. Runes work here because Vitest compiles
 * `.svelte.ts` files through the Svelte plugin.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ObsState } from '#lib/types.ts';

/** A fake EventSource that lets the test push events by hand. */
class FakeEventSource {
	static last: FakeEventSource | null = null;
	listeners = new Map<string, (event: { data: string }) => void>();
	onopen: (() => void) | null = null;
	onerror: (() => void) | null = null;
	closed = false;

	constructor(public url: string) {
		FakeEventSource.last = this;
	}
	addEventListener(type: string, listener: (event: { data: string }) => void) {
		this.listeners.set(type, listener);
	}
	close() {
		this.closed = true;
	}
	/** Test helper: deliver one server-sent event. */
	emit(type: string, data: unknown) {
		this.listeners.get(type)?.({ data: JSON.stringify(data) });
	}
}

const connectedState: ObsState = {
	connection: 'connected',
	obsVersion: '32.2.2',
	obsUrl: 'ws://localhost:4455',
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
	scenes: ['Intro', 'Talk'],
	currentScene: 'Intro'
};

/** fetch stub: answers /api/status with a snapshot, other URLs via `responses`. */
const responses = new Map<string, { status: number; body: unknown }>();
const fetchMock = vi.fn(async (url: string) => {
	if (url === '/api/status') {
		return new Response(JSON.stringify({ state: connectedState, activity: [] }));
	}
	const r = responses.get(url) ?? { status: 200, body: { ok: true } };
	return new Response(JSON.stringify(r.body), { status: r.status });
});

vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('EventSource', FakeEventSource);

// Import after the globals are stubbed.
const { obs } = await import('./obs.svelte.ts');

beforeEach(() => {
	responses.clear();
	fetchMock.mockClear();
});

describe('obs store', () => {
	it('starts disconnected with every action disabled', () => {
		expect(obs.connected).toBe(false);
		expect(obs.canStart).toBe(false);
		expect(obs.canStop).toBe(false);
		expect(obs.canSwitchScene).toBe(false);
	});

	it('loads the snapshot and opens the event stream on connect', async () => {
		await obs.connect();
		expect(obs.connected).toBe(true);
		expect(obs.state.scenes).toEqual(['Intro', 'Talk']);
		expect(obs.canStart).toBe(true);
		expect(obs.canStop).toBe(false);
		expect(FakeEventSource.last?.url).toBe('/api/events');
	});

	it('follows state pushed over the stream', () => {
		const source = FakeEventSource.last!;
		source.onopen?.();
		source.emit('state', {
			...connectedState,
			recording: { ...connectedState.recording, active: true, timecode: '00:00:05.000' }
		});
		expect(obs.isRecording).toBe(true);
		expect(obs.canStart).toBe(false);
		expect(obs.canStop).toBe(true);
		expect(obs.canPause).toBe(true);

		source.emit('activity', {
			at: '2026-10-26T10:00:00.000Z',
			level: 'info',
			kind: 'recording_started',
			params: { file: 'take.mov' },
			message: 'Recording started · take.mov'
		});
		expect(obs.activity).toHaveLength(1);
		expect(obs.activity[0].kind).toBe('recording_started');
	});

	it('posts actions as JSON and reports API errors', async () => {
		responses.set('/api/recording/start', {
			status: 409,
			body: { error: { code: 'ALREADY_RECORDING', message: 'busy' } }
		});
		const ok = await obs.startRecording();
		expect(ok).toBe(false);
		expect(obs.error?.code).toBe('ALREADY_RECORDING');
		expect(obs.busy).toBe(false);

		const [, init] = fetchMock.mock.calls.at(-1)!;
		expect(init?.method).toBe('POST');
		expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });

		obs.clearError();
		expect(obs.error).toBeNull();
	});

	it('shows a readable message when the error body is not JSON', async () => {
		responses.set('/api/scenes/current', { status: 403, body: 'Forbidden' });
		await obs.setScene('Talk');
		expect(obs.error?.code).toBe('NETWORK');
	});

	it('closes the stream on disconnect', () => {
		obs.disconnect();
		expect(FakeEventSource.last?.closed).toBe(true);
	});
});
