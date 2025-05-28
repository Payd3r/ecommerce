FROM node:20-alpine

WORKDIR /usr/src/app

# Copia solo i file package.json prima per sfruttare la cache di Docker
COPY ./Backend/package*.json ./Backend/
COPY ./Test/Backend-Unitari/package*.json ./Test/Backend-Unitari/

# Installa le dipendenze
WORKDIR /usr/src/app/Backend
RUN npm install

WORKDIR /usr/src/app/Test/Backend-Unitari
RUN npm install
# Installa anche chai e altre dipendenze di test se non sono nel package.json
RUN npm install --save-dev chai mocha sinon

# Torna alla cartella principale
WORKDIR /usr/src/app

# Comando predefinito: esegui i test unitari direttamente
CMD ["sh", "-c", "cd /usr/src/app/Test/Backend-Unitari && npm install chai mocha sinon --no-save && ./node_modules/.bin/mocha tests/**/*.test.js --timeout 5000"] 