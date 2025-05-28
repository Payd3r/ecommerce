#!/bin/bash

# Script per eseguire i test del frontend nell'ambiente Docker

echo "Avvio dei test del frontend..."

# Installa le dipendenze di test
cd /usr/src/app/Test/Frontend
npm install jest --no-save

# Esegui i test
echo "Esecuzione dei test del frontend..."
./node_modules/.bin/jest --runInBand

# Codice di uscita
exit $? 