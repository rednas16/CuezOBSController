import { describe, it, expect } from 'vitest';
import { en } from './en';
import { nl } from './nl';

describe('translations', () => {
	it('nl has every key that en has, and nothing extra', () => {
		expect(Object.keys(nl).sort()).toEqual(Object.keys(en).sort());
	});

	it('both languages use the same placeholders per key', () => {
		const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
		for (const key of Object.keys(en) as (keyof typeof en)[]) {
			expect(placeholders(nl[key]), key).toEqual(placeholders(en[key]));
		}
	});
});
