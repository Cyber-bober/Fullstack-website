FROM node:20-alpine AS deps

RUN apk add --no-cache openssl3 libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps && \
    npm install prisma@5.22.0 @prisma/client@5.22.0 --legacy-peer-deps

FROM node:20-alpine AS builder

RUN apk add --no-cache openssl3

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma@5.22.0 generate --schema=./src/lib/schema.prisma

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl3

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/schema.prisma ./src/lib/schema.prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]