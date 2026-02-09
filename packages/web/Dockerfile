FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config and package files
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN pnpm install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/web ./packages/web

# Build
RUN pnpm --filter web run build

# Production stage
FROM node:20-alpine

RUN npm install -g serve

COPY --from=builder /app/packages/web/dist /app

EXPOSE 3000

CMD ["serve", "-s", "/app", "-l", "3000"]
