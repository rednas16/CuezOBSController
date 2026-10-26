import { describe, it, expect } from 'vitest';
import { ObsError, toObsError } from './errors';

describe('ObsError', () => {
	it('maps error codes to sensible HTTP statuses', () => {
		expect(new ObsError('INVALID_REQUEST', 'x').status).toBe(400);
		expect(new ObsError('UNKNOWN_SCENE', 'x').status).toBe(400);
		expect(new ObsError('ALREADY_RECORDING', 'x').status).toBe(409);
		expect(new ObsError('NOT_RECORDING', 'x').status).toBe(409);
		expect(new ObsError('NOT_CONNECTED', 'x').status).toBe(503);
		expect(new ObsError('OBS_ERROR', 'x').status).toBe(502);
	});
});

describe('toObsError', () => {
	it('returns ObsError instances untouched', () => {
		const original = new ObsError('NOT_RECORDING', 'nothing to stop');
		expect(toObsError(original)).toBe(original);
	});

	it('wraps unknown errors as OBS_ERROR and keeps the message', () => {
		const wrapped = toObsError(new Error('socket hung up'));
		expect(wrapped.code).toBe('OBS_ERROR');
		expect(wrapped.message).toBe('socket hung up');
	});

	it('handles non-Error values', () => {
		expect(toObsError('boom').message).toBe('boom');
	});
});
