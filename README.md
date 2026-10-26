# OBS Controller

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

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server             |
| `npm run build` | Production build (Node adapter)  |
| `npm run check` | Type-check Svelte and TypeScript |
| `npm run lint`  | Prettier + ESLint                |
| `npm test`      | Unit tests with Vitest           |


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
