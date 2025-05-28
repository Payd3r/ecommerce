FROM node:20-alpine

WORKDIR /usr/src/app

# Installa le dipendenze di build necessarie per bcrypt e bash
RUN apk add --no-cache --virtual .gyp \
    python3 \
    make \
    g++ \
    bash

# Copia solo i file package.json prima per sfruttare la cache di Docker
COPY ./Backend/package*.json ./Backend/
COPY ./Test/Backend-Integrativi/package*.json ./Test/Backend-Integrativi/

# Installa le dipendenze
WORKDIR /usr/src/app/Backend
RUN npm install

WORKDIR /usr/src/app/Test/Backend-Integrativi
RUN npm install
# Installa anche chai e altre dipendenze di test se non sono nel package.json
RUN npm install --save-dev chai mocha supertest

# Torna alla cartella principale
WORKDIR /usr/src/app

# Cartella Media per test
RUN mkdir -p Media-Test

# Copia tutto il backend nella build finale
COPY ./Backend /usr/src/app/Backend

# Porta per i test
EXPOSE 3016

# Copia lo script di test e rendilo eseguibile
COPY ./Test/Backend-Integrativi/run-tests.sh ./Test/Backend-Integrativi/
RUN chmod +x ./Test/Backend-Integrativi/run-tests.sh

# Comando predefinito: esegui i test direttamente con il percorso completo di mocha
CMD ["bash", "/usr/src/app/Test/Backend-Integrativi/run-tests.sh"] 