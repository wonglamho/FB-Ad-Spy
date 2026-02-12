FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

RUN pnpm install --frozen-lockfile || pnpm install

COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

RUN pnpm --filter server run db:generate
RUN pnpm --filter server run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./node_modules/@fb-ad-spy/shared
COPY --from=builder /app/packages/server/prisma ./prisma
COPY --from=builder /app/packages/server/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
