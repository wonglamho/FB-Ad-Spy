FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY packages/web ./packages/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter web run build

# Production stage with nginx
FROM node:20-alpine

RUN npm install -g serve

COPY --from=builder /app/packages/web/dist /app

EXPOSE 3000

CMD ["serve", "-s", "/app", "-l", "3000"]
