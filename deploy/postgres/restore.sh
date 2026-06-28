#!/usr/bin/env bash
# Restauration d'un dump PostgreSQL Nakoa.
# Usage : ./restore.sh /backups/nakoa_nakoa_20260605_020000.sql.gz

set -euo pipefail

DUMP_FILE="${1:-}"
if [ -z "${DUMP_FILE}" ]; then
  echo "Usage : $0 <chemin_du_dump.sql.gz>"
  echo "Dumps disponibles :"
  ls -lh /backups/ 2>/dev/null || echo "  /backups/ vide ou inaccessible"
  exit 1
fi

if [ ! -f "${DUMP_FILE}" ]; then
  echo "✗ Fichier introuvable : ${DUMP_FILE}"
  exit 1
fi

PGHOST="${PGHOST:-nakoaDB}"
export PGPASSWORD="${POSTGRES_PASSWORD}"

echo "⚠️  Vous allez RESTAURER ${DUMP_FILE} dans la base ${POSTGRES_DB}@${PGHOST}"
echo "    Toutes les données actuelles seront ÉCRASÉES."
read -r -p "    Confirmer ? (tapez 'OUI') : " CONFIRM
if [ "${CONFIRM}" != "OUI" ]; then
  echo "Annulé."
  exit 0
fi

echo "[1/3] Drop & recreate database…"
psql -h "${PGHOST}" -U "${POSTGRES_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"
psql -h "${PGHOST}" -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE ${POSTGRES_DB};"

echo "[2/3] Restauration…"
gunzip -c "${DUMP_FILE}" | psql -h "${PGHOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo "[3/3] Vérification (count migration)…"
psql -h "${PGHOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  -c "SELECT count(*) AS migrations FROM django_migrations;"

echo "✓ Restauration terminée."
