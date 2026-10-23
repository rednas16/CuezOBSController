# ---------------------------------------------------------------------------
# Multi-stage build.
#
# Stage 1 ("build") installs everything and compiles the SvelteKit app.
# Stage 2 ("runtime") copies only the compiled output and the production
# dependencies, so the final image stays small and contains no dev tooling.
# ---------------------------------------------------------------------------

# ---- Stage 1: build --------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies first, in a separate layer, so Docker can reuse this
# layer when only source files change.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and build the app with adapter-node.
# The output ends up in /app/build.
COPY . .
RUN npm run build

# Remove dev dependencies; what remains is what the server needs at runtime.
RUN npm prune --omit=dev

# ---- Stage 2: runtime ------------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Run as the unprivileged "node" user that the base image provides.
USER node

COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json

# adapter-node listens on PORT (default 3000) and HOST (default 0.0.0.0).
EXPOSE 3000

CMD ["node", "build"]
