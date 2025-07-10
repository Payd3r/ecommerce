# Usa un'immagine Node.js standard.
FROM node:18-bullseye

# Imposta la cartella di lavoro
WORKDIR /usr/src/app

# Copia i file di package
COPY Backend/package.json Backend/package-lock.json* ./

# ===============================================================
# INSTALLA TUTTO, ESATTAMENTE COME FAI IN LOCALE
# ===============================================================
RUN npm install --legacy-peer-deps

# Copia il resto del codice sorgente del backend
COPY Backend/ .

EXPOSE 3015

# ===============================================================
# AVVIA L'APP ESATTAMENTE COME FAI IN LOCALE
# ===============================================================
CMD ["node", "app.js"]