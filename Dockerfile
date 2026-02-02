# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Dépendances système nécessaires à Prisma
RUN apk add --no-cache openssl ca-certificates

COPY package*.json ./
COPY prisma ./prisma

# INSTALLEZ TOUTES LES DÉPENDANCES (pas seulement production)
RUN npm ci

RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl ca-certificates

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "pwd && echo '=== LISTING FILES ===' && ls -la && echo '=== LISTING DIST ===' && ls -la dist/ && echo '=== STARTING APP ===' && node dist/main.js"]