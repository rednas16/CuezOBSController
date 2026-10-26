/**
 * GET /api/status
 * The full snapshot: connection, recording, scenes, plus the activity log.
 * The UI loads this once on page load; after that it listens to /api/events.
 */
import { json } from '@sveltejs/kit';
import { getState, getActivity } from '#lib/server/obs.ts';

export function GET() {
	return json({ state: getState(), activity: getActivity() });
}
