#!/usr/bin/env bash
# Réplication offsite des buckets MinIO vers S3 (Backblaze B2, OVH Cold).
set -euo pipefail

REMOTE="${REMOTE:-b2-offsite}"
BUCKETS=("printhub-media" "printhub-private")

for bucket in "${BUCKETS[@]}"; do
  echo "▶ Réplication $bucket → $REMOTE"
  docker compose exec minio mc mirror --overwrite --remove \
    "local/$bucket" "$REMOTE/$bucket"
done

echo "✓ Réplication MinIO terminée"
