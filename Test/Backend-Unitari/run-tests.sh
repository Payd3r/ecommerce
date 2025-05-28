#!/bin/bash

# Script per eseguire i test unitari nell'ambiente Docker

echo "Avvio dei test unitari del backend..."

# Vai alla cartella dei test
cd /usr/src/app/Test/Backend-Unitari

# Verifica che tutte le dipendenze siano installate
npm install

# Esegui i test
echo "Esecuzione dei test unitari..."
npm test

# Codice di uscita
exit $? 