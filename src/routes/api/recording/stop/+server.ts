/**
 * POST /api/recording/stop
 * Tell OBS to stop recording. Answers with the path of the saved file.
 */
import { handle } from '#lib/server/api.ts';
import { stopRecording } from '#lib/server/obs.ts';

export const POST = () => handle(() => stopRecording());
