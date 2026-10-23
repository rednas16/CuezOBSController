/**
 * Server-side configuration.
 *
 * The values are declared and validated in `src/env.ts`. This file just
 * gives them short, readable names so the rest of the server code reads
 * `config.obsUrl` instead of `OBS_WS_URL`.
 *
 * `$app/env/private` can only be imported from server code (`lib/server`,
 * `+server.ts`, hooks). SvelteKit refuses to bundle it for the browser,
 * which guarantees the OBS password never leaves the server.
 */
import { OBS_WS_URL, OBS_WS_PASSWORD, LOG_LEVEL } from '$app/env/private';

export const config = {
	/** WebSocket address of OBS, e.g. ws://localhost:4455 */
	obsUrl: OBS_WS_URL,

	/** Password from OBS > Tools > WebSocket Server Settings (may be empty). */
	obsPassword: OBS_WS_PASSWORD,

	/** How chatty the server logs are. */
	logLevel: LOG_LEVEL
};
