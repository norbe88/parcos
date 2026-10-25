# ══════════════════════════════════════════════════════════════════
# ParcOS — Turnkey Multi-Tenant Dealership Operating System
# Production Docker Container • Port 3000 (Coolify Unified)
# ══════════════════════════════════════════════════════════════════

# ── Stage 1: Build Frontend Assets ──
FROM node:22-alpine AS builder

ENV NODE_ENV=development
WORKDIR /app

# Install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci --include=dev

# Copy source files
COPY . .

# Build production bundle with TypeScript and Vite
RUN npm run build

# ── Stage 2: Production Server ──
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server, landing assets, helpers, and schemas
COPY server/ ./server/
COPY landing/ ./landing/
COPY scripts/marketScraperHelper.js ./scripts/marketScraperHelper.js
COPY scripts/ ./scripts/
COPY staged_imports/ ./staged_imports/
COPY src/db/ ./src/db/

# Directory for vehicle media uploads and documents
RUN mkdir -p /data/parcos/cars

EXPOSE 3000

CMD ["node", "server/api.mjs"]
