#!/usr/bin/env bash
# Restauration PostgreSQL depuis une sauvegarde chiffrée.
#
# Usage : ./restore_postgres.sh printhub-20260518-020000.sql.gz.gpg

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage : $0 <backup-file.sql.gz.gpg>"
  exit 1
fi

BACKUP_FILE="$1"
ENCRYPTION_KEY_FILE="${ENCRYPTION_KEY_FILE:-/etc/printhub/backup.key}"

echo "⚠ ATTENTION : Cette opération va écraser la base courante."
read -p "Confirmer (taper 'OUI') : " confirm
if [ "$confirm" != "OUI" ]; then
  echo "Abandon."
  exit 0
fi

echo "▶ Décryptage"
gpg --batch --yes --passphrase-file "$ENCRYPTION_KEY_FILE" \
  --decrypt --output /tmp/restore.sql.gz "$BACKUP_FILE"

echo "▶ Restauration"
zcat /tmp/restore.sql.gz | docker compose exec -T postgres psql \
  -U "${POSTGRES_USER:-printhub}" \
  -d "${POSTGRES_DB:-printhub}"

rm /tmp/restore.sql.gz
echo "✓ Restauration terminée"
