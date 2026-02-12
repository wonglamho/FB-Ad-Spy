FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl
RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

RUN pnpm install --frozen-lockfile || pnpm install

COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

RUN pnpm --filter server run db:generate
RUN pnpm --filter server run build

EXPOSE 3001

CMD ["node", "packages/server/dist/index.js"]
