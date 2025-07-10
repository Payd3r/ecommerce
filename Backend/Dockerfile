# Usa un'immagine Node.js stabile e compatibile
FROM node:18-slim

WORKDIR /usr/src/app

# Copia SOLO i file di package dalla sottocartella Backend
COPY Backend/package*.json ./

# Installa le dipendenze in modo pulito e sicuro
RUN npm ci --only=production --ignore-scripts

# Copia SOLO il codice sorgente dalla sottocartella Backend
COPY Backend/ .

EXPOSE 3015

# Comando di avvio per la produzione
CMD ["node", "app.js"]