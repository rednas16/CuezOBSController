/**
 * One error class for everything that can go wrong while talking to OBS.
 *
 * Giving each error a stable `code` lets the API routes pick the right
 * HTTP status and lets the UI show a translated message, without anyone
 * having to parse error strings.
 */
import type { ApiErrorCode } from '#lib/types.ts';

export class ObsError extends Error {
	constructor(
		public readonly code: ApiErrorCode,
		message: string
	) {
		super(message);
		this.name = 'ObsError';
	}

	/** HTTP status that fits this error. */
	get status(): number {
		switch (this.code) {
			case 'INVALID_REQUEST':
			case 'UNKNOWN_SCENE':
				return 400;
			case 'ALREADY_RECORDING':
			case 'NOT_RECORDING':
				return 409; // Conflict: the request clashes with the current state
			case 'NOT_CONNECTED':
				return 503; // Service unavailable: OBS is not reachable right now
			default:
				return 502; // Bad gateway: OBS answered with an error
		}
	}
}

/**
 * Turn any thrown value into an ObsError.
 * obs-websocket-js throws its own error objects with a numeric `code`;
 * we keep the message so the log shows what OBS actually said.
 */
export function toObsError(err: unknown): ObsError {
	if (err instanceof ObsError) return err;
	const message = err instanceof Error ? err.message : String(err);
	return new ObsError('OBS_ERROR', message);
}
