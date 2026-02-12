FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config and package files
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install all dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Generate Prisma client
RUN pnpm --filter server run db:generate

# Build server
RUN pnpm --filter server run build

# Debug: find where prisma client was generated (helps future troubleshooting)
RUN find /app -path "*/node_modules/.prisma" -type d 2>/dev/null || true

# ============ Production Stage ============
FROM node:20-alpine

WORKDIR /app

# Install prisma CLI globally for db push at startup
RUN npm install -g prisma@5

# Copy Prisma schema
COPY --from=builder /app/packages/server/prisma ./prisma

# Copy ALL node_modules from root (contains .prisma, @prisma, and all deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy shared package source for runtime resolution
COPY --from=builder /app/packages/shared ./node_modules/@fb-ad-spy/shared

# Copy built server code
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./

EXPOSE 3001

CMD ["sh", "-c", "prisma db push --skip-generate && node dist/index.js"]
