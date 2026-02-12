FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config and package files
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Generate Prisma client
RUN pnpm --filter server run db:generate

# Build server
RUN pnpm --filter server run build

# ============ Production Stage ============
FROM node:20-alpine

WORKDIR /app

# Install only the prisma CLI globally for db push at startup
RUN npm install -g prisma@5

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/packages/server/prisma ./prisma
COPY --from=builder /app/packages/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/server/node_modules/@prisma ./node_modules/@prisma

# Copy built server code
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./

# Copy node_modules from builder (root first, then server-specific to overwrite)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/server/node_modules ./node_modules

# Copy shared package source into node_modules for runtime resolution
COPY --from=builder /app/packages/shared ./node_modules/@fb-ad-spy/shared

EXPOSE 3001

CMD ["sh", "-c", "prisma db push --skip-generate && node dist/index.js"]
