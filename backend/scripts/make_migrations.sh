#!/usr/bin/env bash
# PrintHub — Génération de toutes les migrations Django dans le bon ordre.
#
# Usage :
#   ./scripts/make_migrations.sh
#   docker compose exec api ./scripts/make_migrations.sh
#
# L'ordre est important car certaines apps dépendent d'autres
# (ex : printers → accounts, orders → catalog + printers).

set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ Génération des migrations PrintHub…"
echo ""

# Ordre topologique des apps
APPS=(
  core
  accounts
  authentication
  organizations
  customers
  printers
  catalog
  pricing
  quote_requests
  matching
  documents
  storage
  orders
  production
  logistics
  delivery
  payments
  subscriptions
  billing
  reviews
  notifications
  chat
  analytics
  ai_engine
  ai_assistant
  audit
  kyc
  support
  crm
  workflows
  dashboards
)

for app in "${APPS[@]}"; do
  echo "  → makemigrations $app"
  python manage.py makemigrations "$app" --no-color || {
    echo "  ⚠ Échec sur $app — vérifie les imports / FK"
    exit 1
  }
done

echo ""
echo "▶ Vérification des conflits…"
python manage.py makemigrations --check --dry-run --no-color || {
  echo "⚠ Des migrations restent à générer."
  exit 1
}

echo ""
echo "✓ Toutes les migrations sont générées."
echo ""
echo "Prochaines étapes :"
echo "  python manage.py migrate              # applique les migrations"
echo "  python manage.py seed_demo            # charge les données de démo"
