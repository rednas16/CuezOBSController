/**
 * End-to-end tests run the real app against a fake OBS (e2e/fake-obs.mjs),
 * so they work on any machine and in CI without OBS Studio installed.
 */
import { defineConfig } from '@playwright/test';

const APP_PORT = 5199;
const FAKE_OBS_PORT = 4466;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false, // the tests share one fake OBS and one app server
	workers: 1,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: `http://localhost:${APP_PORT}`,
		locale: 'en-US', // the UI follows the browser language; tests assert English copy
		trace: 'retain-on-failure'
	},
	webServer: [
		{
			command: `node e2e/fake-obs.mjs`,
			port: FAKE_OBS_PORT + 1, // the control port; up means the fake is ready
			reuseExistingServer: !process.env.CI,
			env: { FAKE_OBS_PORT: String(FAKE_OBS_PORT) }
		},
		{
			command: `npm run build && node build`,
			url: `http://localhost:${APP_PORT}/api/status`,
			reuseExistingServer: !process.env.CI,
			env: {
				PORT: String(APP_PORT),
				OBS_WS_URL: `ws://localhost:${FAKE_OBS_PORT}`,
				OBS_WS_PASSWORD: '',
				LOG_LEVEL: 'warn'
			}
		}
	]
});
