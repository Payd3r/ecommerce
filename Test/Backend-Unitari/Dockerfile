FROM node:20-alpine

WORKDIR /usr/src/app

# Copia i file package per l'installazione delle dipendenze
COPY ./Test/Backend-Unitari/package*.json ./Test/Backend-Unitari/

# Installa dipendenze dei test (incluse devDependencies)
WORKDIR /usr/src/app/Test/Backend-Unitari
RUN npm install --include=dev

# Copia i file di configurazione e test
COPY ./Test/Backend-Unitari/ ./

# Crea la cartella per i risultati dei test
RUN mkdir -p /usr/src/app/Test/Output && chmod -R 777 /usr/src/app/Test/Output

# Comando di default per eseguire i test
CMD ["npm", "test"] 