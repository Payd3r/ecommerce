# Usa un'immagine Node.js leggera
FROM node:20-alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /usr/src/app

# Copia i file di package per installare le dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il resto del codice sorgente
COPY . .

# Crea la directory Media se non esiste
RUN mkdir -p ../Media

# Espone la porta specificata nell'env
EXPOSE 3005

# Comando per avviare l'applicazione
CMD ["npm", "start"] 