#!/bin/bash

# Crea la directory Media se non esiste
mkdir -p Media

# Avvia i container Docker
docker-compose up -d

echo "Progetto ecommerce avviato con successo!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3005" 