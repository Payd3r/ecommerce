# STAGE 1: Build
FROM node:18-bullseye AS builder
WORKDIR /app

# Copia i file di package, INCLUSO il nostro nuovo package-lock.json
COPY Frontend/package.json Frontend/package-lock.json ./

# Usa 'npm ci' che è fatto apposta per usare il package-lock.json
# È il modo più affidabile per una build riproducibile.
RUN npm ci

# Copia tutto il resto del codice del frontend
COPY Frontend/ .

# Esegui la build
RUN npm run build

# STAGE 2: Serve
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Non ci serve un nginx.conf custom, quello di default va bene per servire file statici
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]