# OBS Controller

[![CI](https://github.com/rednas16/CuezOBSController/actions/workflows/ci.yml/badge.svg)](https://github.com/rednas16/CuezOBSController/actions/workflows/ci.yml)

A small web app that remote-controls [OBS Studio](https://obsproject.com): start and stop recordings,
switch scenes, and watch the recording status update live.

Built with SvelteKit (Svelte 5 runes), TypeScript and Tailwind CSS. The SvelteKit server talks to
OBS over its WebSocket API; the browser only talks to our own API routes.

## Requirements

- Node.js 20 or newer
- OBS Studio 28 or newer, with the WebSocket server enabled
  (Tools › WebSocket Server Settings › Enable WebSocket server)

## Setup

```sh
npm install
cp .env.example .env   # then fill in OBS_WS_PASSWORD
npm run dev
```

Open http://localhost:5173.

## Scripts

| Command            | What it does                                                        |
| ------------------ | ------------------------------------------------------------------- |
| `npm run dev`      | Start the dev server                                                |
| `npm run build`    | Production build (Node adapter)                                     |
| `npm run check`    | Type-check Svelte and TypeScript                                    |
| `npm run lint`     | Prettier + ESLint                                                   |
| `npm test`         | Unit tests with Vitest                                              |
| `npm run test:e2e` | End-to-end tests with Playwright against a fake OBS (no OBS needed) |

## API

| Method | Path                    | What it does                                        |
| ------ | ----------------------- | --------------------------------------------------- |
| GET    | `/api/status`           | Full snapshot: connection, recording, scenes, log   |
| GET    | `/api/events`           | Server-Sent Events stream: live state and log lines |
| GET    | `/api/scenes`           | Scene names and the current program scene           |
| POST   | `/api/scenes/current`   | Switch scene. Body: `{ "sceneName": "Intro" }`      |
| POST   | `/api/recording/start`  | Start recording                                     |
| POST   | `/api/recording/pause`  | Pause the recording                                 |
| POST   | `/api/recording/resume` | Resume a paused recording                           |
| POST   | `/api/recording/stop`   | Stop recording. Answers with the saved file's path  |

Pausing needs an OBS output configuration that supports it: in OBS, Settings › Output › Recording
Quality must be anything other than "Same as stream". Otherwise the API answers `PAUSE_UNSUPPORTED`.

Errors come back as `{ "error": { "code", "message" } }` with a fitting HTTP status
(400 bad request, 409 wrong state, 503 OBS not connected, 502 OBS error).

## Tests

- **Unit tests** (`npm test`): error mapping, formatting helpers, translations and the browser store.
- **End-to-end tests** (`npm run test:e2e`): Playwright drives the real app in Chromium against
  `e2e/fake-obs.mjs`, a small server that speaks the obs-websocket v5 protocol (JSON and msgpack).
  Its message shapes were captured from a real OBS 32.2.2 session (`e2e/fixtures/obs-capture.json`),
  so the tests cover scene switching, recording, a scene created in OBS, a lost connection and the
  language switch without OBS being installed. They run in CI on every push.

## Run with Docker

OBS keeps running on your own machine; only the web app runs in the container.

```sh
cp .env.example .env       # fill in OBS_WS_PASSWORD
docker compose up --build
```

Open http://localhost:3000.

Inside the container the app uses `OBS_WS_URL_DOCKER` from `.env` (default
`ws://host.docker.internal:4455`, which is how a container reaches the machine that runs Docker).
`OBS_WS_URL` stays `localhost` for `npm run dev`, so both ways of running work from the same `.env`.

_More sections (architecture, API) are added as the project grows._
