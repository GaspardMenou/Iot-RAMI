# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app

# On force les placeholders lors du build CI
# Les fichiers JS contiendront littéralement ces chaînes de caractères
ENV VITE_APP_BACK_URL=VITE_APP_BACK_URL_PLACEHOLDER
ENV VITE_SOCKET_URL=VITE_SOCKET_URL_PLACEHOLDER

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build-only

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# On ajoute notre script d'entrée
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
