# Développement local — foconshop-api

## Prérequis
- Docker & Docker Compose
- Node.js (>=18) & npm
- Prisma CLI version 6.0.0 (utilisez `npm install prisma@6.0.0` pour éviter les mises à jour automatiques vers v7)

## Démarrage rapide
1. Cloner le projet  
   `git clone <url-du-repo>`  
   `cd foconshop-api`

2. Démarrer PostgreSQL avec Docker  
   `docker compose up -d`

3. Installer les dépendances  
   `npm install`

4. Configurer l'environnement  
   `cp .env.example .env`

5. Générer un secret JWT sécurisé (exécutez et copiez la sortie dans .env)  
   `node -e "console.log('JWT_SECRET=\"' + require('crypto').randomBytes(64).toString('hex') + '\"')"`

6. Initialiser Prisma  
   `npx prisma format`  # Formate et valide le schéma  
   `npx prisma generate`  # Génère le client Prisma  
   `npx prisma migrate dev --name init`  # Applique les migrations initiales

7. Démarrer le serveur en mode développement  
   `npm run start:dev`

## Accès aux interfaces
- API : http://localhost:3000
- Prisma Studio : http://localhost:5555 (via `npx prisma studio`)
- PgAdmin UI : http://localhost:8080 (login: `pgadmin@local` / `pgadmin`)

## Développement
- `npm run start:dev` : Démarrer en mode watch  
- `npm run build` : Build pour production  
- `npm run start:prod` : Démarrer en production  

## Base de données
- `docker compose up -d` : Démarrer PostgreSQL  
- `docker compose down` : Arrêter PostgreSQL  
- `docker compose logs` : Voir les logs  
- La base de données par défaut est définie dans `docker-compose.yml` (user: `foconshop`, pass: `foconshop`, db: `foconshop_dev`, port: 5432).

## Prisma
- `npx prisma studio` : Interface de gestion de la base  
- `npx prisma generate` : Générer le client Prisma  
- `npx prisma db push` : Appliquer le schéma à la DB (alternative pour prototyping)  
- `npx prisma migrate dev --name <nom>` : Créer une migration  

## Tests
- `npm run test` : Tests unitaires  
- `npm run test:e2e` : Tests e2e  
- `npm run test:cov` : Couverture des tests  
- `npx ts-node test-prisma.ts` : Tester la connexion à la base  

## Pour réinitialiser la base de données locale
`docker compose down -v`  
`docker compose up -d`  
`npx prisma migrate reset --force`

## Description du Projet
Ce repository est le back-end API REST pour Foconshop, construit avec NestJS (framework Node.js). Pour plus de détails sur NestJS, consultez https://docs.nestjs.com.

## Déploiement
Pour déployer en production, consultez la documentation NestJS : https://docs.nestjs.com/deployment.  

## Support
- Discord NestJS : https://discord.gg/G7Qnnhy  
- Twitter : https://twitter.com/nestframework  

Nest est sous licence MIT[](https://github.com/nestjs/nest/blob/master/LICENSE).