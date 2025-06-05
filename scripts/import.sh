#!/bin/sh
# // NEW SECTION: import.sh
set -e
ZIPFILE="$1"
MEDIA_DIR=./Media
if [ ! -f "$ZIPFILE" ]; then
  echo "File non trovato: $ZIPFILE" >&2
  exit 1
fi
unzip -o "$ZIPFILE" -d ./
echo "Import completato" 