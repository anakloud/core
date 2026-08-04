# Stage 1: Build & Bundling Stage (using Node-slim and copying Bun binary)
FROM node:20-slim AS builder
WORKDIR /app

# Copy the bun binary from official bun image
COPY --from=oven/bun:1.1-slim /usr/local/bin/bun /usr/local/bin/bun

# Copy monorepo configurations and locks
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/core-server/package.json ./apps/core-server/

# Install pnpm pinned to the project workspace version
RUN npm install -g pnpm@10.17.1

# Install all development and production dependencies
RUN pnpm install --filter core-server --frozen-lockfile

# Copy the server source code and tsconfig
COPY apps/core-server/src ./apps/core-server/src
COPY apps/core-server/tsconfig.json ./apps/core-server/

# Bundle modules into a single index.js file
WORKDIR /app/apps/core-server
RUN bun build src/index.ts --target=bun --outfile=dist/index.js

# Stage 2: Hyper-Lightweight Runtime Stage
FROM oven/bun:1.1-slim AS runner
WORKDIR /app/apps/core-server

RUN apt-get update \
  && apt-get install -y --no-install-recommends libreoffice-core libreoffice-writer poppler-utils fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

# Copy ONLY the static bundled index.js
COPY --from=builder /app/apps/core-server/dist ./dist

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=3001

# Expose server listener port
EXPOSE 3001

# Run the bundled file directly
CMD ["bun", "run", "dist/index.js"]
