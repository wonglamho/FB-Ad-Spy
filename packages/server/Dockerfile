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

# ============ Production Stage ============
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL compatibility libraries (required by Prisma on Alpine)
RUN apk add --no-cache openssl

# Copy Prisma schema
COPY --from=builder /app/packages/server/prisma ./prisma

# Copy ALL node_modules from root
COPY --from=builder /app/node_modules ./node_modules

# Copy shared package source for runtime resolution
COPY --from=builder /app/packages/shared ./node_modules/@fb-ad-spy/shared

# Copy built server code
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
