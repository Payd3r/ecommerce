# Usa un'immagine Node.js leggera come base
FROM node:20-alpine

# Imposta la directory di lavoro principale per l'applicazione
WORKDIR /usr/src/app

# Copia solo i file necessari per installare le dipendenze
# Questo sfrutta la cache di Docker: se package.json non cambia,
# questo strato non verrà rieseguito, velocizzando le build future.
COPY Backend/package.json ./

# Installa le dipendenze di produzione e nodemon per lo sviluppo
# Le dipendenze vengono installate in /usr/src/app/node_modules
RUN npm install && npm install -g nodemon

# Copia tutto il codice sorgente del backend in una sottocartella 'src'
# Questo mantiene il codice separato dalle dipendenze
COPY Backend/ /usr/src/app/src/

# Imposta la directory di lavoro finale su quella del codice sorgente
WORKDIR /usr/src/app/src

# Imposta la variabile d'ambiente per Node.js
ENV NODE_ENV=development

# Espone la porta su cui l'applicazione sarà in ascolto
EXPOSE 3015

# Comando per avviare l'applicazione in modalità sviluppo con nodemon
CMD ["npm", "run", "dev"]