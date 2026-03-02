# Stage 1: Build
FROM node:lts-slim AS builder

WORKDIR /app

# Installation des outils de compilation nécessaires pour les modules natifs (bcrypt)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock*.json ./
RUN npm install

COPY . .
RUN npm run build

# On retire les devDependencies pour ne garder que le nécessaire pour la prod
RUN npm prune --omit=dev

# Stage 2: Production
FROM node:lts-slim

WORKDIR /home/node/app

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# On copie les node_modules déjà installés et nettoyés depuis le builder
COPY --from=builder /app/node_modules ./node_modules
# On copie le code compilé
COPY --from=builder /app/dist ./dist
# On copie le dossier db (migrations, seeders, config) et le .sequelizerc pour les migrations
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/.sequelizerc ./
# On copie le package.json
COPY package.json ./

EXPOSE 3000

# On lance directement node
CMD ["node", "dist/server.js"]
