# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Dépendances système nécessaires à Prisma
RUN apk add --no-cache openssl ca-certificates

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --only=production
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

CMD ["sh", "-c", "echo 'Checking dist directory...' && ls -la dist/ && echo 'Starting application...' && npm run start:prod"]