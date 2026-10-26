/**
 * Small helpers shared by all `/api` routes, so each route stays a few lines.
 */
import { json } from '@sveltejs/kit';
import { ObsError, toObsError } from './errors';
import { log } from './logger';
import type { ApiError } from '#lib/types.ts';

/**
 * Run an action and turn its result, or its error, into a JSON response.
 *
 *   export const POST = () => handle(() => startRecording());
 *
 * Successful actions answer `{ ok: true, ...result }`.
 * Errors answer `{ error: { code, message } }` with a fitting HTTP status.
 */
export async function handle<T extends object | void>(
	action: () => Promise<T> | T
): Promise<Response> {
	try {
		const result = await action();
		return json({ ok: true, ...(result ?? {}) });
	} catch (err) {
		const obsError: ObsError = toObsError(err);
		const body: ApiError = { error: { code: obsError.code, message: obsError.message } };
		// 4xx errors are the caller's problem, log quietly; 5xx are ours, log loudly.
		if (obsError.status >= 500) log.error(body.error, 'API request failed');
		else log.info(body.error, 'API request rejected');
		return json(body, { status: obsError.status });
	}
}

/**
 * Read a JSON body and make sure a given string field is present.
 * Throws an ObsError with code INVALID_REQUEST otherwise.
 */
export async function readStringField(request: Request, field: string): Promise<string> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw new ObsError('INVALID_REQUEST', 'Request body must be JSON');
	}
	const value = (body as Record<string, unknown> | null)?.[field];
	if (typeof value !== 'string' || value.trim() === '') {
		throw new ObsError('INVALID_REQUEST', `Field “${field}” is required`);
	}
	return value;
}
