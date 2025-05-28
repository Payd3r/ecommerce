FROM node:20-alpine

WORKDIR /usr/src/app

# Copia i file package.json
COPY ./Backend/package*.json ./Backend/
COPY ./Test/Backend-Unitari/package*.json ./Test/Backend-Unitari/

# Installa le dipendenze del backend
WORKDIR /usr/src/app/Backend
RUN npm install

# Installa le dipendenze di test
WORKDIR /usr/src/app/Test/Backend-Unitari
RUN npm install
RUN npm install --save-dev chai mocha sinon proxyquire express jsonwebtoken

# Copia solo il codice sorgente, non i node_modules
WORKDIR /usr/src/app
COPY ./Backend/routes ./Backend/routes/
COPY ./Backend/models ./Backend/models/
COPY ./Backend/middleware ./Backend/middleware/
COPY ./Backend/services ./Backend/services/
COPY ./Test/Backend-Unitari/tests ./Test/Backend-Unitari/tests/

# Comando predefinito: esegui i test unitari
CMD ["sh", "-c", "cd /usr/src/app/Test/Backend-Unitari && npm run test:example"] 