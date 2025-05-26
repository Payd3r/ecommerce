FROM node:20-alpine

# Installa Playwright e altre dipendenze
RUN apk add --no-cache \
    chromium \
    firefox \
    ffmpeg \
    wget \
    curl \
    procps \
    python3 \
    py3-pip \
    build-base \
    netcat-openbsd

# Imposta le variabili d'ambiente per Playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Crea e imposta la directory di lavoro
WORKDIR /app/Test

# Copia i file necessari
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto dei file di test
COPY . .

# Rendi eseguibile lo script di inizializzazione
RUN chmod +x init-test-env.sh

# Installa k6 per i test di performance
RUN wget -q -O /tmp/k6.tar.gz https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz && \
    tar -xzf /tmp/k6.tar.gz -C /tmp && \
    cp /tmp/k6-v0.45.0-linux-amd64/k6 /usr/local/bin/k6 && \
    rm -rf /tmp/k6*

# Comando predefinito - usa lo script di inizializzazione
ENTRYPOINT ["./init-test-env.sh"]
CMD ["npm", "test"] 