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

# Re-declare ARGs for the second stage if they are needed as ENVs
ARG NODE_ENV=production
ARG DB_HOST
ARG DB_PORT_IN
ARG DB_NAME
ARG DB_USER
ARG DB_PASSWORD
ARG DB_DIALECT=postgres
ARG KAFKA_BROKERS
ARG NODE_PORT_IN=3000

ENV NODE_ENV=$NODE_ENV
ENV DB_HOST=$DB_HOST
ENV DB_NAME=$DB_NAME
ENV DB_USER=$DB_USER
ENV DB_PASSWORD=$DB_PASSWORD
ENV DB_DIALECT=$DB_DIALECT
ENV KAFKA_BROKERS=$KAFKA_BROKERS
ENV NODE_PORT_IN=$NODE_PORT_IN

# Install only production dependencies
COPY package.json package-lock*.json ./
RUN npm install --omit=dev

# Copy build output from stage 1
COPY --from=builder /app/dist ./dist

EXPOSE $NODE_PORT_IN

CMD ["npm", "run", "command", "start"]
