# ===============================================================
# STAGE 1: Build dell'Applicazione Frontend (ORA ROBUSTO)
# ===============================================================
FROM node:18-bullseye AS builder

# Aggiungi gli strumenti di compilazione essenziali
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia SOLO i file di package dalla sottocartella Frontend
COPY Frontend/package*.json ./

# Installa TUTTE le dipendenze (incluse devDependencies) necessarie per la build
RUN npm ci --ignore-scripts

# Copia SOLO il codice sorgente dalla sottocartella Frontend
COPY Frontend/ .

# Esegui il comando di build
RUN npm run build

# ===============================================================
# STAGE 2: Servire i File Statici con Nginx
# ===============================================================
FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY Frontend/nginx.conf /etc/nginx/conf.d/ecommerce.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]