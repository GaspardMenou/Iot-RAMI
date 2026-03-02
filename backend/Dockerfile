# Stage 1: Build
FROM node:lts-slim AS builder

WORKDIR /app

# We need all dependencies to build (including devDependencies for tsup)
COPY package.json package-lock*.json ./
RUN npm install

COPY . .

# Run build
RUN npm run build

# Stage 2: Production
FROM node:lts-slim

WORKDIR /home/node/app

# Only NODE_ENV is relevant for build/runtime optimization
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Install only production dependencies
COPY package.json package-lock*.json ./
RUN npm install --omit=dev

# Copy build output from stage 1
COPY --from=builder /app/dist ./dist

# The rest of the environment variables (DB_*, KAFKA_*, MQTT_*) 
# will be provided at runtime via docker-compose or Kubernetes secrets.

EXPOSE 3000

CMD ["npm", "run", "command", "start"]
