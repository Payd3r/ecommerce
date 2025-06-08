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

# Copia i file di configurazione
COPY package*.json ./

# Installa le dipendenze Node.js
RUN npm install --only=production && npm cache clean --force
RUN npm install -g nodemon

# Copia il codice sorgente
COPY . .

# Crea l'utente non-root per sicurezza
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -D -H -u 1001 -s /sbin/nologin nodejs nodejs

# Cambia ownership dei file
RUN chown -R nodejs:nodejs /usr/src/app

# Espone la porta del servizio
EXPOSE 3012

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3012/api/health || exit 1

# Per ora esegui come root per accedere al socket Docker
# In produzione si dovrebbe configurare i permessi appropriati
# USER nodejs

# Comando di avvio
CMD ["nodemon", "server.js"] 