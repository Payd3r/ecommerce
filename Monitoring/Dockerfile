# Usa un'immagine Node.js come base, che è più completa per la compilazione
FROM node:18-bullseye AS base

# 'bullseye' è la versione full di Debian, include già molti strumenti.
# Aggiungiamo solo quello che potrebbe mancare.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    netcat-traditional \
    procps \
    htop \
    mariadb-client \
    zip \
    unzip \
    bash \
    coreutils \
    tar \
    build-essential \
    # build-essential include 'make', 'g++', e altre librerie essenziali per la compilazione
    && rm -rf /var/lib/apt/lists/*

# Imposta una variabile d'ambiente per la cartella dell'applicazione
ENV APP_HOME /usr/src/app
WORKDIR $APP_HOME

# Installare Docker CLI e Compose...
# (Questa parte rimane invariata)
RUN curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-26.1.1.tgz | tar -xz \
    && mv docker/docker /usr/local/bin/docker && rm -rf docker
RUN mkdir -p /usr/local/lib/docker/cli-plugins && \
    curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose && \
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# --- FASE DI BUILD DELLE DIPENDENZE ---
FROM base AS deps

# Copia SOLO i file di package dalla sottocartella Monitoring del contesto
COPY Monitoring/package.json Monitoring/package-lock.json* ./

# Installa le dipendenze in modo pulito e sicuro
# 'npm ci' ora dovrebbe avere tutti gli strumenti per compilare qualsiasi cosa
RUN npm ci --only=production --ignore-scripts

# --- FASE DI PRODUZIONE FINALE ---
FROM base AS production

# Copia le dipendenze installate dalla fase precedente
COPY --from=deps $APP_HOME/node_modules ./node_modules

# Copia SOLO il codice sorgente dalla sottocartella Monitoring
COPY Monitoring/ .

EXPOSE 3017

HEALTHCHECK CMD curl -f http://localhost:3017/api/health || exit 1
CMD ["node", "server.js"]