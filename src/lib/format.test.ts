import { describe, it, expect } from 'vitest';
import { formatTimecode, formatBytes, fileName } from './format';

describe('formatTimecode', () => {
	it('drops the milliseconds', () => {
		expect(formatTimecode('00:12:34.567')).toBe('00:12:34');
	});
	it('shows zeros when idle', () => {
		expect(formatTimecode('')).toBe('00:00:00');
	});
});

describe('formatBytes', () => {
	it('picks a sensible unit', () => {
		expect(formatBytes(32_424_354)).toBe('32 MB');
		expect(formatBytes(1_500_000_000)).toBe('1.50 GB');
		expect(formatBytes(512_000)).toBe('512 kB');
	});
});

describe('fileName', () => {
	it('keeps only the last path segment', () => {
		expect(fileName('/Users/me/Movies/2026-10-26 11-27-14.mov')).toBe('2026-10-26 11-27-14.mov');
		expect(fileName('C:\\Videos\\take.mkv')).toBe('take.mkv');
	});
});
