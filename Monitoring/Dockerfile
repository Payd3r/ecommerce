# Usa un'immagine Node.js come base
FROM node:18-alpine

# Installa le dipendenze di sistema necessarie
RUN apk add --no-cache \
    curl \
    netcat-openbsd \
    procps \
    htop \
    docker-cli \
    mariadb-client \
    zip \
    unzip \
    bash \
    coreutils \
    && rm -rf /var/cache/apk/*

# Installa Docker Compose Plugin
RUN mkdir -p /usr/local/lib/docker/cli-plugins && \
    curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose && \
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Crea directory di lavoro
WORKDIR /usr/src/app

# --- SEZIONE CORRETTA DEI COPY ---
# Copia i file di configurazione dalla sottocartella Monitoring del contesto
COPY package*.json ./

# Installa le dipendenze Node.js
RUN npm install --only=production && npm cache clean --force
RUN npm install -g nodemon

# Copia il codice sorgente dalla sottocartella Monitoring del contesto
COPY . .

# --- FINE SEZIONE CORRETTA ---

# Crea l'utente non-root per sicurezza (QUESTO NON VIENE USATO)
# ... le tue righe per creare l'utente nodejs ...

# Cambia ownership dei file (QUESTO NON VIENE USATO)
# ... la tua riga chown ...

# Espone la porta del servizio
EXPOSE 3017

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3017/api/health || exit 1

# Comando di avvio
CMD ["nodemon", "server.js"]