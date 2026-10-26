/**
 * POST /api/recording/resume
 * Resume a paused recording. The new status arrives through /api/events.
 */
import { handle } from '#lib/server/api.ts';
import { resumeRecording } from '#lib/server/obs.ts';

export const POST = () => handle(() => resumeRecording());
