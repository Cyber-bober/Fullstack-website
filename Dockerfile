# ЭТАП 1: Установка зависимостей
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl3 python3 py3-pip
RUN python3 -m venv /venv && /venv/bin/pip install pytest requests pytest-html
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ЭТАП 2: Сборка
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl3
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /venv /venv
COPY . .
ENV PATH="/venv/bin:$PATH"
RUN npx prisma generate --schema=./src/lib/schema.prisma
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ЭТАП 3: Production
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl3 python3
RUN python3 -m venv /venv && /venv/bin/pip install pytest requests pytest-html
WORKDIR /app
ENV PATH="/venv/bin:$PATH"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/src/lib/schema.prisma ./src/lib/schema.prisma
COPY --from=builder /app/tests ./tests
COPY --from=builder /venv /venv

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "npx --yes prisma@5.22.0 db push --schema=./src/lib/schema.prisma --accept-data-loss --skip-generate && node server.js"]