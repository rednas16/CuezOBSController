/**
 * Declaration of every environment variable the app uses.
 *
 * SvelteKit 3 reads this file and exposes the values through
 * `$app/env/private` (server only) and `$app/env/public` (browser too).
 * Every variable here is private: none of them is ever sent to the browser.
 *
 * The `schema` function receives the raw string from `.env` (or undefined
 * when it is missing) and returns the value we want to work with, including
 * a sensible default. Throwing an error here stops the app at startup with
 * a clear message instead of failing later in a confusing way.
 *
 * See `.env.example` for a description of each variable.
 */
import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	OBS_WS_URL: {
		description: 'WebSocket address of OBS, e.g. ws://localhost:4455',
		schema: (value) => {
			const url = value || 'ws://localhost:4455';
			if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
				throw new Error('OBS_WS_URL must start with ws:// or wss://');
			}
			return url;
		}
	},
	OBS_WS_PASSWORD: {
		description: 'Password from OBS > Tools > WebSocket Server Settings (may be empty)',
		schema: (value) => value ?? ''
	},
	LOG_LEVEL: {
		description: 'Server log level: trace | debug | info | warn | error',
		schema: (value) => {
			const level = value || 'info';
			const allowed = ['trace', 'debug', 'info', 'warn', 'error'];
			if (!allowed.includes(level)) {
				throw new Error(`LOG_LEVEL must be one of ${allowed.join(', ')}`);
			}
			return level;
		}
	}
});
