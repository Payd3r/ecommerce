#!/bin/bash

# Script per eseguire i test unitari nell'ambiente Docker

echo "Avvio dei test unitari del backend..."

# Esegui i test
echo "Esecuzione dei test unitari..."
npm run test --prefix /usr/src/app/Test/Backend-Unitari

# Codice di uscita
exit $? 