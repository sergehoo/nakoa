# PrintHub backend — raccourcis dev

.PHONY: help up down build logs sh migrate makemigrations make_all_migrations shell test lint format mypy \
        createsuperuser flush seed seed_reset fresh worker beat flower clean

help:
	@echo "PrintHub backend — commandes disponibles :"
	@echo "  make up               Démarrer tous les services"
	@echo "  make down             Arrêter tous les services"
	@echo "  make build            Reconstruire les images"
	@echo "  make logs             Logs en streaming"
	@echo "  make sh               Shell dans le container api"
	@echo "  make migrate          Appliquer les migrations"
	@echo "  make makemigrations   Créer les migrations"
	@echo "  make shell            Django shell_plus"
	@echo "  make test             Lancer pytest"
	@echo "  make lint             Ruff + black --check + mypy"
	@echo "  make format           Black + ruff --fix"
	@echo "  make make_all_migrations  Migrations de toutes les apps (ordre topologique)"
	@echo "  make seed             Charger le dataset de démo (seed_demo)"
	@echo "  make seed_reset       Reset + seed complet (dev uniquement)"
	@echo "  make fresh            Reset DB + migrate + seed (workflow complet)"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f --tail=200

sh:
	docker compose exec api bash

migrate:
	docker compose exec api python manage.py migrate

makemigrations:
	docker compose exec api python manage.py makemigrations

make_all_migrations:
	docker compose exec api ./scripts/make_migrations.sh

shell:
	docker compose exec api python manage.py shell_plus

createsuperuser:
	docker compose exec api python manage.py createsuperuser

flush:
	docker compose exec api python manage.py flush --no-input

seed:
	docker compose exec api python manage.py seed_demo

seed_reset:
	docker compose exec api python manage.py seed_demo --reset

fresh:
	docker compose exec api python manage.py flush --no-input
	docker compose exec api python manage.py migrate
	docker compose exec api python manage.py seed_demo

test:
	docker compose exec api pytest --cov=apps --cov-report=term-missing

lint:
	docker compose exec api ruff check .
	docker compose exec api black --check .
	docker compose exec api mypy apps config

format:
	docker compose exec api black .
	docker compose exec api ruff check --fix .

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	find . -type d -name .mypy_cache -exec rm -rf {} +
	find . -type d -name .ruff_cache -exec rm -rf {} +
