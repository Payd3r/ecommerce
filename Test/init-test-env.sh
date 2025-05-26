#!/bin/bash

# Attendi che il database sia pronto
echo "Aspettando che il database sia pronto..."
until wget -q --spider http://db-test:3306 || nc -z db-test 3306; do
  echo "Database non ancora pronto... attendere"
  sleep 2
done
echo "Database pronto!"

# Attendi che il backend sia pronto
echo "Aspettando che il backend sia pronto..."
until wget -q --spider http://backend-test:3015/health || nc -z backend-test 3015; do
  echo "Backend non ancora pronto... attendere"
  sleep 2
done
echo "Backend pronto!"

# Attendi che il frontend sia pronto
echo "Aspettando che il frontend sia pronto..."
until wget -q --spider http://frontend-test:80 || nc -z frontend-test 80; do
  echo "Frontend non ancora pronto... attendere"
  sleep 2
done
echo "Frontend pronto!"

echo "Tutti i servizi sono pronti! Avvio dei test..."

# Esegui i test specificati
if [ -z "$1" ]; then
  npm test
else
  echo "Esecuzione comando: $@"
  eval "$@"
fi 