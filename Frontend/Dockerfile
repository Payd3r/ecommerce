# Stage 1: Build dell'applicazione
FROM node:18-bullseye AS builder
WORKDIR /app
COPY Frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY Frontend/ .
RUN npm run build

# Stage 2: Servire con Nginx
FROM nginx:1.25-alpine
# Copiamo solo i file compilati. Nginx userà la sua configurazione di default
# che è perfetta per servire un sito statico.
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]