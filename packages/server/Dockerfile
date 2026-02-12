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

# Prepare a clean node_modules for production:
# Use pnpm deploy to flatten all dependencies into a standalone directory
RUN pnpm --filter server deploy --prod /app/production

# Copy generated prisma client into the production node_modules
RUN cp -r /app/node_modules/.prisma /app/production/node_modules/.prisma 2>/dev/null || true
RUN cp -r /app/node_modules/@prisma /app/production/node_modules/@prisma 2>/dev/null || true

# ============ Production Stage ============
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy production-ready node_modules (flattened, no symlinks)
COPY --from=builder /app/production/node_modules ./node_modules

# Copy shared package for runtime resolution
COPY --from=builder /app/packages/shared ./node_modules/@fb-ad-spy/shared

# Copy Prisma schema
COPY --from=builder /app/packages/server/prisma ./prisma

# Copy built server code
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./

EXPOSE 3001

# Use node to call prisma programmatically, then start server
CMD ["sh", "-c", "node ./node_modules/.prisma/../prisma/build/index.js db push --schema=./prisma/schema.prisma 2>/dev/null; node dist/index.js"]
