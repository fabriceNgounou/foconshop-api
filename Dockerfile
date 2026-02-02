# =========================
# Étape 1 : Build
# =========================
FROM node:18-alpine AS builder

WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste du projet
COPY . .

# Générer Prisma
RUN npx prisma generate

# Build NestJS
RUN npm run build


# =========================
# Étape 2 : Production
# =========================
FROM node:18-alpine

WORKDIR /app

# Copier uniquement ce qui est nécessaire
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

ENV NODE_ENV=production
EXPOSE 3000

# Lancer les migrations puis l'API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
