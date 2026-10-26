/**
 * End-to-end tests: real browser, real app server, fake OBS.
 * See e2e/fake-obs.mjs for the control endpoints used below.
 */
import { test, expect, type Page } from '@playwright/test';

const control = 'http://localhost:4467';

/** Poke the fake OBS from the outside, like a person clicking in OBS. */
async function obs(action: string) {
	await fetch(`${control}/${action}`, { method: 'POST' });
}

async function openApp(page: Page) {
	await page.goto('/');
	await expect(page.getByRole('status').filter({ hasText: 'Connected' })).toBeVisible();
}

test.beforeEach(async () => {
	await obs('reset');
});

test('shows the connection and the scenes from OBS', async ({ page }) => {
	await openApp(page);
	await expect(page.getByRole('banner').getByText('OBS 32.2.2')).toBeVisible();
	await expect(page.getByText('3 available')).toBeVisible();
	await expect(page.getByRole('button', { name: /^Intro/ })).toHaveAttribute(
		'aria-current',
		'true'
	);
	await expect(page.getByLabel('Program scene')).toHaveValue('Intro');
});

test('switches scenes with the buttons and the dropdown', async ({ page }) => {
	await openApp(page);

	await page.getByRole('button', { name: /^Screen share/ }).click();
	await expect(page.getByRole('button', { name: /^Screen share/ })).toHaveAttribute(
		'aria-current',
		'true'
	);
	await expect(page.getByText('Switched to Screen share')).toBeVisible();
	await expect(page.getByLabel('Program scene')).toHaveValue('Screen share');

	await page.getByLabel('Program scene').selectOption('Talking head');
	await expect(page.getByRole('button', { name: /^Talking head/ })).toHaveAttribute(
		'aria-current',
		'true'
	);
	await expect(page.getByText('Scene changed to “Talking head”')).toBeVisible();
});

test('starts and stops a recording', async ({ page }) => {
	await openApp(page);
	const start = page.getByRole('button', { name: 'Start recording' });
	const stop = page.getByRole('button', { name: 'Stop recording' });

	await expect(start).toBeEnabled();
	await expect(stop).toBeDisabled();

	await start.click();
	await expect(page.getByText('REC', { exact: true })).toBeVisible();
	await expect(page.getByText(/\/recordings\/.*\.mov/)).toBeVisible();
	await expect(stop).toBeEnabled();
	await expect(page.getByRole('button', { name: 'Recording…' })).toBeDisabled();
	await expect(page).toHaveTitle(/^● 00:00:0\d · OBS Controller$/);

	await stop.click();
	await expect(page.getByText('Idle')).toBeVisible();
	await expect(page.getByText(/Recording stopped/)).toBeVisible();
	await expect(start).toBeEnabled();
	await expect(page).toHaveTitle('OBS Controller');
});

test('picks up a scene created in OBS without a reload', async ({ page }) => {
	await openApp(page);
	await obs('scene-created?name=Q%26A');
	await expect(page.getByRole('button', { name: 'Q&A' })).toBeVisible();
	await expect(page.getByText('4 available')).toBeVisible();
	await expect(page.getByText('Scene list updated')).toBeVisible();
});

test('explains a lost connection and recovers', async ({ page }) => {
	await openApp(page);
	await obs('drop');

	const banner = page.getByRole('alert');
	await expect(banner).toBeVisible();
	await expect(banner).toContainText('Controls are disabled');
	await expect(page.getByRole('button', { name: 'Start recording' })).toBeDisabled();

	// The server reconnects by itself (first retry after 1s).
	await expect(banner).toBeHidden({ timeout: 10_000 });
	await expect(page.getByRole('button', { name: 'Start recording' })).toBeEnabled();
});

test('switches language and remembers it', async ({ page }) => {
	await openApp(page);
	await page.getByRole('button', { name: 'Taal: Nederlands' }).click();
	await expect(page.getByRole('button', { name: 'Opname starten' })).toBeVisible();
	await expect(page.getByText('Verbonden met OBS 32.2.2').first()).toBeVisible();

	await page.reload();
	await expect(page.getByRole('button', { name: 'Opname starten' })).toBeVisible();
	await page.getByRole('button', { name: 'Language: English' }).click();
	await expect(page.getByRole('button', { name: 'Start recording' })).toBeVisible();
});
