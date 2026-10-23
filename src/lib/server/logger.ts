/**
 * One shared logger for the whole server.
 *
 * We use pino because it is fast and writes structured JSON, which is
 * easy to search in production. During development the output is piped
 * through `pino-pretty` so it stays readable in the terminal.
 *
 * Usage:  log.info({ scene: 'Intro' }, 'scene changed');
 */
import pino from 'pino';
import { dev } from '$app/env';
import { config } from './config';

export const log = pino({
	level: config.logLevel,
	// Pretty colours in dev, plain JSON in production (Docker, servers).
	transport: dev ? { target: 'pino-pretty', options: { colorize: true } } : undefined
});
