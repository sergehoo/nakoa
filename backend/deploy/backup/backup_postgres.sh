#!/usr/bin/env bash
# Sauvegarde PostgreSQL chiffrée avec rotation et upload offsite.
#
# Usage : à exécuter via cron toutes les 24h depuis le host.
#   0 2 * * * /opt/printhub/deploy/backup/backup_postgres.sh >> /var/log/printhub-backup.log 2>&1

set -euo pipefail

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/var/backups/printhub}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-printhub-backups}"
ENCRYPTION_KEY_FILE="${ENCRYPTION_KEY_FILE:-/etc/printhub/backup.key}"

mkdir -p "$BACKUP_DIR"
DUMP_FILE="$BACKUP_DIR/printhub-$DATE.sql.gz"
ENCRYPTED_FILE="$DUMP_FILE.gpg"

echo "▶ Dump PostgreSQL → $DUMP_FILE"
docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-printhub}" \
  -d "${POSTGRES_DB:-printhub}" \
  --no-owner --no-privileges --clean --if-exists \
  | gzip -9 > "$DUMP_FILE"

echo "▶ Chiffrement GPG"
gpg --batch --yes --passphrase-file "$ENCRYPTION_KEY_FILE" \
  --symmetric --cipher-algo AES256 --output "$ENCRYPTED_FILE" "$DUMP_FILE"
rm "$DUMP_FILE"

echo "▶ Upload offsite vers s3://$S3_BUCKET/postgres/"
aws s3 cp "$ENCRYPTED_FILE" "s3://$S3_BUCKET/postgres/" --storage-class STANDARD_IA

echo "▶ Rotation locale (> $RETENTION_DAYS j)"
find "$BACKUP_DIR" -name "printhub-*.sql.gz.gpg" -mtime "+$RETENTION_DAYS" -delete

echo "▶ Notification Slack"
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
  SIZE=$(du -h "$ENCRYPTED_FILE" | cut -f1)
  curl -sX POST -H "Content-Type: application/json" \
    -d "{\"text\":\"✅ Backup PrintHub OK — $DATE — $SIZE\"}" \
    "$SLACK_WEBHOOK_URL" > /dev/null
fi

echo "✓ Sauvegarde terminée — $ENCRYPTED_FILE"
