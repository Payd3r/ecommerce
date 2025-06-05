#!/bin/sh
# // NEW SECTION: restore.sh
set -e
docker compose down -v
docker compose up --build -d
echo "Restore completato" 