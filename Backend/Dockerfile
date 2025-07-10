# Usa un'immagine Node.js stabile e completa
FROM node:18-bullseye

# Aggiungi gli strumenti di compilazione essenziali
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ build-essential \
    && rm -rf /var/lib/apt/lists/*

# Imposta la directory di lavoro dove risiederà l'applicazione
WORKDIR /usr/src/app

# Copia i file di package e installa le dipendenze.
# Questo crea /usr/src/app/node_modules all'interno dell'immagine.
COPY Backend/package.json Backend/package-lock.json* ./
RUN npm install --only=production --legacy-peer-deps --ignore-scripts --build-from-source

# Copia il codice sorgente nella directory di lavoro
COPY Backend/ .

EXPOSE 3015

# Il comando di avvio ora punta al file app.js nella WORKDIR corrente
CMD ["node", "app.js"]