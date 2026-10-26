/**
 * One shared logger for the whole server.
 *
 * We use pino because it is fast and writes structured JSON, which is
 * easy to search in production. During development the output goes
 * through `pino-pretty` so it stays readable in the terminal.
 *
 * Usage:  log.info({ scene: 'Intro' }, 'scene changed');
 */
import pino from 'pino';
import pretty from 'pino-pretty';
import { dev } from '$app/env';
import { config } from './config';

export const log = pino(
	{ level: config.logLevel },
	// Pretty colours in dev; plain JSON on stdout in production (Docker, servers).
	dev ? pretty({ colorize: true }) : undefined
);
