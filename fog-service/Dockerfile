FROM node:lts-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:lts-alpine AS production-stage
WORKDIR /app
COPY --from=build-stage /app/dist ./dist
COPY package*.json ./
RUN npm install --omit=dev
EXPOSE 3001
CMD ["node", "dist/index.js"]
