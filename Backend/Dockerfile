# ===============================================================
# Usa un'immagine Node.js standard basata su Debian "Bullseye".
# Questa versione è nota per la sua stabilità e compatibilità con i moduli nativi.
# ===============================================================
FROM node:18-bullseye

# ===============================================================
# Installa Python e gli strumenti di compilazione. 'bcrypt' e altri
# moduli nativi dipendono pesantemente da questi per la compilazione.
# ===============================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copia SOLO i file di package per sfruttare la cache di Docker
COPY Backend/package.json ./

# ===============================================================
# Installa le dipendenze. Il flag '--build-from-source' forza
# la ricompilazione di moduli come bcrypt usando gli strumenti
# che abbiamo appena installato, garantendo la compatibilità.
# ===============================================================
RUN npm install --only=production --legacy-peer-deps --ignore-scripts --build-from-source

# Copia il codice sorgente dell'applicazione
COPY Backend/ .

EXPOSE 3015

# Comando per avviare l'applicazione in produzione
CMD ["node", "app.js"]