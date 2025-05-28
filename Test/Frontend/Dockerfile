FROM node:20-alpine

WORKDIR /usr/src/app

# Installa Jest globalmente
RUN npm install -g jest

# Installa le dipendenze per i test
COPY ./Test/Frontend/package*.json ./Test/Frontend/
WORKDIR /usr/src/app/Test/Frontend
RUN npm install

# Torna alla cartella principale
WORKDIR /usr/src/app

# Crea una cartella per il frontend
RUN mkdir -p Frontend

# Comando predefinito: esegui i test frontend
CMD ["npm", "run", "test", "--prefix", "/usr/src/app/Test/Frontend"] 