# ---- Build stage ----
FROM node:20-slim AS builder

WORKDIR /app

# Dépendances système nécessaires à Prisma
RUN apt-get update && apt-get install -y openssl ca-certificates

COPY package*.json ./
COPY prisma ./prisma

RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start:prod"]

