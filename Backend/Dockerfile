# Usa un'immagine Node.js leggera
FROM node:20-alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /usr/src/app

# Copia i file di package per installare le dipendenze
COPY package*.json ./
ENV NODE_ENV=development

# Installa le dipendenze e nodemon globalmente
RUN npm install && npm install -g nodemon

# Crea una directory per i moduli node
RUN mkdir -p /usr/src/app/node_modules

# Copia tutto il resto del codice sorgente
COPY . .

# Espone la porta specificata nell'env
EXPOSE 3001
EXPOSE 3015

# Comando per avviare l'applicazione
CMD ["npm", "run", "dev"] 