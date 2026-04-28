# ── Stage 1 : dépendances ────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# ── Stage 2 : runtime ────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Sécurité : utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

USER appuser

# En Kubernetes, HOSTNAME est automatiquement le nom du Pod
ENV NODE_ENV=production
ENV PORT=4000
ENV LOG_LEVEL=info

EXPOSE 4000

STOPSIGNAL SIGTERM

CMD ["node", "src/index.js"]
