# -----------------------------------------------------------------------------
# Stage 1: Base & Dependencies
# Lightweight Node.js 20 on Alpine Linux (musl-based, ~50MB base)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install build dependencies if native addons ever needed (clean cache after)
RUN apk add --no-cache libc6-compat

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install production dependencies only for lean container footprint
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Development / Builder Stage
# Builds client bundles and transpile scripts
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY . .

# Build frontend and static assets
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production Runner
# Minimal runtime image (~130MB total) with security hardening
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Tini ensures signals (SIGTERM, SIGINT) are properly forwarded to Node
# and prevents zombie processes when running as PID 1
RUN apk add --no-cache tini curl

WORKDIR /app

# Enforce secure environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    NOTES_STORAGE_PATH=/data/notes.json

# Create non-root storage directory with appropriate permissions
RUN mkdir -p /data && chown -R node:node /data /app

# Copy production node_modules from dependencies stage
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules

# Copy built frontend assets and server application
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/server.ts ./server.ts
COPY --chown=node:node --from=builder /app/tsconfig.json ./tsconfig.json

# Switch to the unprivileged 'node' user for security compliance
USER node

# Expose microservice REST port
EXPOSE 3000

# Docker native healthcheck polling the microservice health route
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Execute using tini signal init wrapper
ENTRYPOINT ["/sbin/tini", "--"]

# Launch production server via tsx or node runtime
CMD ["node", "--loader", "tsx", "server.ts"]
