/**
 * GET /api/scenes
 * The list of scene names and which one is currently on program.
 */
import { json } from '@sveltejs/kit';
import { getState } from '#lib/server/obs.ts';

export function GET() {
	const { scenes, currentScene } = getState();
	return json({ scenes, currentScene });
}
