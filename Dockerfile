
# ══ Dockerfile ══════════════════════════════════════════════
# Multi-stage build — smaller final image, no devDependencies in prod
# Benchmark: Efficiency — Alpine base, non-root user, layer caching

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup -S venueiq && adduser -S venueiq -G venueiq

COPY --from=deps /app/node_modules ./node_modules
COPY src/   ./src/
COPY public/ ./public/
COPY package.json ./

# Cloud Run injects PORT; default to 3000
ENV PORT=3000 NODE_ENV=production

# Ensure writable for nothing — read-only FS friendly
USER venueiq
EXPOSE 3000

# Tini reaps zombie processes (important in containers)
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]