#!/bin/sh
# // NEW SECTION: backup.sh
set -e
BACKUP_DIR=./backups
MEDIA_DIR=./Media
mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d-%H%M%S)
ZIPFILE="$BACKUP_DIR/media-backup-$TS.zip"
zip -r "$ZIPFILE" "$MEDIA_DIR"
echo "$ZIPFILE" 