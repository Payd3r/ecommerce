# Usa un'immagine Node.js stabile e completa
FROM node:18-bullseye

# Aggiungi gli strumenti di compilazione essenziali
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copia SOLO i file di package dalla sottocartella Backend
COPY Backend/package*.json ./

# ===============================================================
# MODIFICA CHIAVE: Usa 'npm install' più permissivo per le dipendenze di produzione
# ===============================================================
RUN npm install --only=production --legacy-peer-deps --ignore-scripts

# Copia SOLO il codice sorgente dalla sottocartella Backend
COPY Backend/ .

EXPOSE 3015

# Comando di avvio per la produzione
CMD ["node", "app.js"]