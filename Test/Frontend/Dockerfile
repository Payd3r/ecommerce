FROM node:20-alpine

WORKDIR /usr/src/app

# Copia tutto il codice sorgente necessario
COPY . .

# Installa le dipendenze di test
WORKDIR /usr/src/app/Test/Frontend
RUN npm install

# Crea la cartella per i risultati dei test
RUN mkdir -p /usr/src/app/Test/Output

# Imposta i permessi corretti
RUN chmod -R 777 /usr/src/app/Test/Output

# Comando di default per eseguire i test
CMD ["npm", "test"] 