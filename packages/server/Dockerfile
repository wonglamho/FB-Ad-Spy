FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config and package files
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install dependencies
RUN pnpm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Generate Prisma client
RUN pnpm --filter server run db:generate

# Build
RUN pnpm --filter server run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files for production install
COPY packages/server/package.json ./
COPY packages/server/prisma ./prisma

# Install production dependencies + prisma CLI
RUN pnpm install --prod && pnpm add -D prisma

# Generate Prisma client in production stage
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/packages/server/dist ./dist

# Copy shared package (needed at runtime for type references)
COPY --from=builder /app/packages/shared /app/node_modules/@fb-ad-spy/shared

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
