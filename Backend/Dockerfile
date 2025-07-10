# Usa l'immagine Node.js più standard possibile
FROM node:18-bullseye

# Imposta la cartella di lavoro
WORKDIR /usr/src/app

# Copia TUTTO il necessario dalla sottocartella Backend
COPY Backend/ .

# Esegui il comando di installazione più permissivo possibile
# e cattura l'output dettagliato in un file di log
RUN npm install --legacy-peer-deps --verbose > npm-log.txt 2>&1 || (cat npm-log.txt && exit 1)