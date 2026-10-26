/**
 * POST /api/scenes/current   body: { "sceneName": "Intro" }
 * Switch the program scene in OBS.
 */
import type { RequestHandler } from './$types';
import { handle, readStringField } from '#lib/server/api.ts';
import { setCurrentScene } from '#lib/server/obs.ts';

export const POST: RequestHandler = ({ request }) =>
	handle(async () => {
		const sceneName = await readStringField(request, 'sceneName');
		await setCurrentScene(sceneName);
		return { sceneName };
	});
