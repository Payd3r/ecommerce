#!/bin/bash

# Script per eseguire i test integrativi nell'ambiente Docker

echo "Avvio dei test integrativi..."

# Assicurati che il DB di test sia pronto
echo "Attesa dell'avvio del database di test..."
sleep 5

# Installa le dipendenze necessarie per i test
echo "Installazione delle dipendenze di test..."
cd /usr/src/app/Backend
npm install express mysql2 jsonwebtoken bcrypt --no-save

cd /usr/src/app/Test/Backend-Integrativi
npm install chai mocha supertest --no-save

# Esegui i test
echo "Esecuzione dei test integrativi..."
./node_modules/.bin/mocha tests/**/*.test.js --timeout 10000 --exit

# Codice di uscita
exit $? 