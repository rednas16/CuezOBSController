/**
 * GET /api/events
 * Live updates for the browser, using Server-Sent Events (SSE).
 *
 * SSE is a plain HTTP response that stays open. The server writes small
 * text blocks of the form
 *
 *     event: state
 *     data: {"connection":"connected", ...}
 *
 * and the browser reads them with the built-in `EventSource` API, which
 * also reconnects by itself when the connection drops.
 *
 * We send two kinds of events:
 *   - "state"    the full ObsState, whenever anything changes
 *   - "activity" one new line for the activity log
 * plus a comment line every 15 seconds so proxies do not close an idle
 * connection.
 */
import type { RequestHandler } from './$types';
import { events, getState, getActivity } from '#lib/server/obs.ts';
import { log } from '#lib/server/logger.ts';
import type { ActivityEntry, ObsState } from '#lib/types.ts';

const KEEPALIVE_MS = 15_000;

export const GET: RequestHandler = ({ request }) => {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		start(controller) {
			/** Write one SSE message. */
			const send = (event: string, data: unknown) => {
				controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
			};

			const onState = (state: ObsState) => send('state', state);
			const onActivity = (entry: ActivityEntry) => send('activity', entry);

			// First give the newcomer the current picture, then follow changes.
			send('state', getState());
			for (const entry of getActivity()) send('activity', entry);
			events.on('state', onState);
			events.on('activity', onActivity);

			const keepalive = setInterval(() => {
				controller.enqueue(encoder.encode(': keepalive\n\n'));
			}, KEEPALIVE_MS);

			// The browser left (tab closed, navigated away): stop listening,
			// otherwise this connection would leak a listener forever.
			const cleanup = () => {
				clearInterval(keepalive);
				events.off('state', onState);
				events.off('activity', onActivity);
				try {
					controller.close();
				} catch {
					// already closed
				}
				log.debug('SSE client disconnected');
			};
			request.signal.addEventListener('abort', cleanup);

			log.debug('SSE client connected');
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
