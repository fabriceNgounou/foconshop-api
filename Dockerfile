# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl ca-certificates

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY . .

# Compilation TypeScript
RUN npx tsc --project tsconfig.build.json

# Debug : vérifier le contenu de dist/
RUN echo "=== Contents of dist/ ===" && ls -la dist/

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

CMD ["node", "dist/main.js"]