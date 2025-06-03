FROM node:20-alpine

WORKDIR /usr/src/app

# Copia solo i file package.json prima per sfruttare la cache di Docker
COPY ./Backend/package*.json ./Backend/
COPY ./Backend-Integrativi/package*.json ./Backend-Integrativi/

# Installa le dipendenze (in una sola cartella node_modules globale)
WORKDIR /usr/src/app/Backend
RUN npm install

WORKDIR /usr/src/app/Backend-Integrativi
RUN npm install

# Torna alla cartella principale
WORKDIR /usr/src/app

# Cartella Media per test
RUN mkdir -p Media

# Copia lo script di avvio test e rendilo eseguibile
COPY ./Backend-Integrativi/run-tests.sh /usr/src/app/
RUN chmod +x /usr/src/app/run-tests.sh

# Porta per i test
EXPOSE 3016

# Comando predefinito: esegue i test
CMD ["/usr/src/app/run-tests.sh"] 