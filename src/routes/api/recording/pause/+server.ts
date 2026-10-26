/**
 * POST /api/recording/pause
 * Pause the current recording. The new status arrives through /api/events.
 */
import { handle } from '#lib/server/api.ts';
import { pauseRecording } from '#lib/server/obs.ts';

export const POST = () => handle(() => pauseRecording());
