FROM node:22-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate && pnpm build

FROM node:22-bookworm-slim
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/generated ./generated
COPY --from=build /app/generated ./build/generated
RUN mkdir -p /data
ENV DATABASE_URL=file:/data/dev.sqlite
EXPOSE 3000
CMD ["sh", "-c", "pnpm prisma migrate deploy && exec pnpm start"]
