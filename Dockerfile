# Stage 1: Build & Bundling Stage (using Node-slim and copying Bun binary)
FROM node:20-slim AS builder
WORKDIR /app

# Install git (required by pnpm for some dependency resolutions)
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

# Copy the bun binary from official bun image (bookworm-based, avoids stale bullseye-security index issue)
COPY --from=oven/bun:1.3-slim /usr/local/bin/bun /usr/local/bin/bun

# Copy monorepo configurations and locks
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/core-server/package.json ./apps/core-server/
COPY packages/utils/package.json ./packages/utils/
COPY packages/messages/package.json ./packages/messages/

# Install pnpm pinned to the project workspace version
RUN npm install -g pnpm@10.17.1

# Install all development and production dependencies
RUN pnpm install --filter core-server... --frozen-lockfile

# Copy the server source code and tsconfig
COPY apps/core-server/src ./apps/core-server/src
COPY apps/core-server/tsconfig.json ./apps/core-server/
COPY packages/utils/src ./packages/utils/src
COPY packages/utils/tsconfig.json ./packages/utils/
COPY packages/messages/src ./packages/messages/src
COPY packages/messages/tsconfig.json ./packages/messages/

# Bundle modules into a single index.js file
WORKDIR /app/apps/core-server
RUN bun build src/index.ts --target=bun --outfile=dist/index.js

# Stage 2: Hyper-Lightweight Runtime Stage
FROM oven/bun:1.3-slim AS runner
WORKDIR /app/apps/core-server

# Install runtime dependencies and the Infisical CLI
RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates curl \
  && curl -1sLf 'https://artifacts-cli.infisical.com/setup.deb.sh' | bash \
  && apt-get update \
  && apt-get install -y --no-install-recommends infisical \
  && rm -rf /var/lib/apt/lists/*

# Copy the bundled server and its Infisical launch configuration.
COPY --from=builder /app/apps/core-server/dist ./dist
COPY start.sh ./

# Set environment variables for production
ARG APP_ENV=prod
ENV APP_ENV=$APP_ENV
ENV NODE_ENV=production

EXPOSE 3001
CMD ["./start.sh"]