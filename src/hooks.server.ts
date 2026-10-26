/**
 * Server hooks. SvelteKit calls `init` once when the server starts.
 * We use it to open the OBS connection right away, so the app is already
 * connected (or already retrying) by the time the first browser arrives.
 */
import { start } from '#lib/server/obs.ts';

export function init() {
	start();
}
