# ===== deps =====
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
# Try reproducible install first; fall back to npm install if the lockfile drifted.
# This unblocks the build when a dep was added but the lockfile was not regenerated.
RUN npm ci --prefer-offline --no-audit --no-fund \
    || (echo ">>> Lockfile drifted, regenerating via 'npm install'" \
        && npm install --prefer-offline --no-audit --no-fund)

# ===== builder =====
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time public env vars (passées depuis docker-compose.prod.yml via build args).
# Les variables NEXT_PUBLIC_* doivent être présentes pendant `next build` car elles
# sont *inlinées dans le bundle JavaScript client* à la compilation.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8001
ARG NEXT_PUBLIC_APP_NAME=Nakoa
ARG NEXT_PUBLIC_APP_URL=https://nakoahub.com
ARG NEXT_PUBLIC_DEFAULT_LOCALE=fr
ARG NEXT_PUBLIC_SUPPORTED_LOCALES=fr,en
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_DEFAULT_LOCALE=$NEXT_PUBLIC_DEFAULT_LOCALE
ENV NEXT_PUBLIC_SUPPORTED_LOCALES=$NEXT_PUBLIC_SUPPORTED_LOCALES

RUN npm run build

# ===== runner =====
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
# Crée le dossier public au cas où il serait vide/absent côté contexte de build
RUN mkdir -p ./public && chown -R nextjs:nodejs ./public
COPY --from=builder --chown=nextjs:nodejs /app/public/ ./public/
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
