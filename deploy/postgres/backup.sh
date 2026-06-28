#!/usr/bin/env bash
# Dump PostgreSQL quotidien + rotation 14 jours + upload S3/MinIO optionnel.
# Lancé par le service `nakoabackup` (docker-compose.prod.yml).

set -euo pipefail

# ============================================================================
# Variables d'environnement attendues :
#   POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
#   PGHOST       (défaut: nakoaDB)
#   BACKUP_DIR   (défaut: /backups)
#   RETENTION    (défaut: 14 jours)
#   S3_ENABLED   (défaut: false)
#   S3_BUCKET    (si S3_ENABLED=true)
#   AWS_S3_ENDPOINT_URL, AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY
# ============================================================================

PGHOST="${PGHOST:-nakoaDB}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION="${RETENTION:-14}"
S3_ENABLED="${S3_ENABLED:-false}"

mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${BACKUP_DIR}/nakoa_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

log "Démarrage backup → ${DUMP_FILE}"

# 1. Dump compressé
export PGPASSWORD="${POSTGRES_PASSWORD}"
pg_dump \
  -h "${PGHOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --no-owner \
  --no-acl \
  --format=plain \
  | gzip -9 > "${DUMP_FILE}"

SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
log "✓ Dump terminé (${SIZE})"

# 2. Upload S3/MinIO si activé
if [ "${S3_ENABLED}" = "true" ] && [ -n "${S3_BUCKET:-}" ]; then
  log "Upload S3 vers s3://${S3_BUCKET}/backups/"
  if command -v aws &>/dev/null; then
    aws --endpoint-url="${AWS_S3_ENDPOINT_URL:-https://s3.amazonaws.com}" \
      s3 cp "${DUMP_FILE}" "s3://${S3_BUCKET}/backups/$(basename "${DUMP_FILE}")"
    log "✓ Upload S3 OK"
  else
    log "⚠ aws CLI absent — skip upload S3"
  fi
fi

# 3. Rotation : supprime les dumps locaux > RETENTION jours
log "Rotation > ${RETENTION} jours…"
DELETED=$(find "${BACKUP_DIR}" -name "nakoa_*.sql.gz" -mtime +"${RETENTION}" -print -delete | wc -l)
log "✓ ${DELETED} fichier(s) supprimé(s)"

# 4. Vérifie l'intégrité (gzip -t)
log "Vérification intégrité…"
if gzip -t "${DUMP_FILE}"; then
  log "✓ Backup OK"
else
  log "✗ Backup CORROMPU — alertez l'équipe !"
  exit 1
fi

log "Termine ${TIMESTAMP}"
