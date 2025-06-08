FROM node:20-alpine

WORKDIR /usr/src/app

# Copia i file package per l'installazione delle dipendenze
COPY ./Test/Frontend/package*.json ./Test/Frontend/

# Installa le dipendenze di test (incluse devDependencies)
WORKDIR /usr/src/app/Test/Frontend
RUN npm install --include=dev

# Copia i file di test e configurazione
COPY ./Test/Frontend/ ./

# Crea la cartella per i risultati dei test
RUN mkdir -p /usr/src/app/Test/Output && chmod -R 777 /usr/src/app/Test/Output

# Comando di default per eseguire i test
CMD ["npm", "test"] 