#!/bin/bash

# Script per eseguire i test del frontend nell'ambiente Docker

echo "Avvio dei test del frontend..."

# Attendi che il servizio frontend sia pronto
echo "Attesa dell'avvio del servizio frontend..."
sleep 5

# Esegui i test
echo "Esecuzione dei test del frontend..."
npm run test --prefix /usr/src/app/Test/Frontend

# Codice di uscita
exit $? 