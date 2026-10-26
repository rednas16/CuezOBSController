/**
 * Tiny translation helper built on runes; no library needed for two languages.
 *
 *   import { i18n, t } from '#lib/i18n/index.svelte.ts';
 *   t('rec.start')                          -> "Start recording"
 *   t('toast.switched', { scene: 'Intro' }) -> "Switched to Intro"
 *   i18n.toggle()                           -> switches EN <-> NL
 *
 * Because `t` reads `i18n.locale`, which is `$state`, every component that
 * calls it re-renders when the language changes. The choice is remembered
 * in localStorage; the first visit follows the browser language.
 */
import { en, type MessageKey } from './en';
import { nl } from './nl';

export type Locale = 'en' | 'nl';
const messages: Record<Locale, Record<MessageKey, string>> = { en, nl };
const STORAGE_KEY = 'obs-controller.locale';

class I18n {
	locale = $state<Locale>('en');

	/** Pick the stored language, else the browser's. Call once in the browser. */
	init() {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored === 'en' || stored === 'nl') {
				this.locale = stored;
				return;
			}
		} catch {
			// localStorage may be unavailable (private mode); fall through
		}
		this.locale = navigator.language.toLowerCase().startsWith('nl') ? 'nl' : 'en';
	}

	set(locale: Locale) {
		this.locale = locale;
		try {
			localStorage.setItem(STORAGE_KEY, locale);
		} catch {
			// ignore
		}
	}

	toggle() {
		this.set(this.locale === 'en' ? 'nl' : 'en');
	}

	/** Translate a key and fill in {placeholders}. */
	t(key: MessageKey, params: Record<string, string | number> = {}): string {
		const template = messages[this.locale][key] ?? en[key] ?? key;
		return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''));
	}
}

export const i18n = new I18n();

/** Shorthand so templates can write {t('key')}. */
export const t = (key: MessageKey, params?: Record<string, string | number>) => i18n.t(key, params);

export type { MessageKey };
