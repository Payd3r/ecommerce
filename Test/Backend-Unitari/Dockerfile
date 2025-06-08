FROM node:20-alpine

WORKDIR /usr/src/app

# Copia tutto il codice sorgente necessario
COPY ./Backend ./Backend/
COPY ./Test/Backend-Unitari ./Test/Backend-Unitari/

# Installa tutte le dipendenze di test (comprese devDependencies)
WORKDIR /usr/src/app/Test/Backend-Unitari
RUN npm install && npm install -g jest

# Crea la cartella per i risultati dei test
RUN mkdir -p /usr/src/app/Test/Output

# Imposta i permessi corretti
RUN chmod -R 777 /usr/src/app/Test/Output

# Comando di default per eseguire i test
CMD ["npm", "test"] 