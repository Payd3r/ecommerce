#!/bin/bash

# Script per eseguire i test del frontend nell'ambiente Docker

echo "Avvio dei test del frontend..."

# Installa le dipendenze di test
cd /usr/src/app/Test/Frontend
npm install

# Esegui i test con coverage e verbose
echo "Esecuzione dei test del frontend..."
./node_modules/.bin/jest --runInBand --verbose --coverage

# Salva il codice di uscita
EXIT_CODE=$?

# Mostra un riassunto dei test
echo ""
echo "===== RIEPILOGO DEI TEST FRONTEND ====="
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Tutti i test sono passati con successo!"
else
  echo "❌ Alcuni test sono falliti. Controlla i dettagli sopra."
fi
echo "====================================="

# Codice di uscita
exit $EXIT_CODE 