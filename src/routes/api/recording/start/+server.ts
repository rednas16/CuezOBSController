/**
 * POST /api/recording/start
 * Tell OBS to start recording. The new status arrives through /api/events.
 */
import { handle } from '#lib/server/api.ts';
import { startRecording } from '#lib/server/obs.ts';

export const POST = () => handle(() => startRecording());
