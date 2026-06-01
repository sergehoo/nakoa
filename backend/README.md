# PrintHub — Backend

Plateforme SaaS d'impression pour l'Afrique de l'Ouest : marketplace + ERP de production + CRM + IA.

## Stack

- Python 3.12 — Django 5 — DRF 3.15
- PostgreSQL 16 + PostGIS
- Redis 7 (cache, broker Celery, channel layer)
- Celery 5.4 (workers default / ai / heavy)
- Django Channels 4 (WebSockets)
- MinIO / S3 (stockage objet)
- Elasticsearch 8 (recherche)
- Traefik (reverse proxy + TLS automatique)
- JWT (SimpleJWT) + 2FA TOTP + OTP SMS

## Structure

```
backend/
├── config/                    # Settings multi-env, urls, asgi, celery, routing WS
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   ├── staging.py
│   │   └── production.py
│   ├── urls.py
│   ├── asgi.py
│   ├── wsgi.py
│   ├── routing.py
│   └── celery.py
├── apps/                      # 30 apps métier modulaires
│   ├── core/                  # Modèles abstraits, exceptions, pagination, middleware
│   ├── accounts/              # User custom, profils, adresses, devices
│   ├── authentication/        # JWT, OTP, 2FA TOTP, OAuth, sessions
│   ├── organizations/         # Équipes internes / clientes
│   ├── printers/              # Imprimeurs : machines, finitions, zones, capacités
│   ├── customers/             # Clients individuels et entreprise (B2B)
│   ├── catalog/               # Produits, catégories, options, variantes
│   ├── pricing/               # Grilles tarifaires + calculateur de devis
│   ├── quote_requests/        # Demandes de devis multi-imprimeurs
│   ├── matching/              # Moteur de matching intelligent
│   ├── orders/                # Cycle de vie complet (FSM, 18 statuts)
│   ├── production/            # ERP atelier : jobs, étapes, opérateurs
│   ├── logistics/             # Transporteurs, expéditions
│   ├── delivery/              # Livraison GPS + preuves
│   ├── payments/              # Multi-providers : Stripe, CinetPay, Wave, OM, MoMo
│   ├── subscriptions/         # Plans SaaS imprimeur (Basic / Pro / Premium / Enterprise)
│   ├── billing/               # Factures, TVA, exports comptables
│   ├── reviews/               # Avis clients + réponses imprimeur
│   ├── notifications/         # Email + SMS + Push FCM + WhatsApp + in-app
│   ├── chat/                  # Messagerie temps réel WebSocket
│   ├── support/               # Tickets, base de connaissances
│   ├── crm/                   # Pipeline commercial, leads, activités
│   ├── ai_engine/             # Multi-provider (OpenAI / Anthropic / Ollama) + analyse BAT
│   ├── ai_assistant/          # Assistants conversationnels par rôle
│   ├── audit/                 # Journal d'audit immuable
│   ├── kyc/                   # KYC client + KYB imprimeur
│   ├── analytics/             # Collecte d'événements
│   ├── dashboards/            # Endpoints agrégés temps réel
│   ├── workflows/             # Moteur de règles métier
│   ├── documents/             # Stockage générique (BAT, factures, contrats)
│   └── storage/               # Présigned URLs S3/MinIO
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
├── docker-compose.yml
├── Dockerfile
├── Makefile
├── pyproject.toml             # Ruff / Black / Mypy / Pytest
├── manage.py
└── .env.example
```

## Démarrage rapide

```bash
# 1. Cloner et copier l'env
cp .env.example .env

# 2. Démarrer tous les services
make up
# (équivalent : docker compose up -d)

# 3. Migrations
make migrate

# 4. Super-utilisateur
make createsuperuser

# 5. Vérifier
open http://localhost:8000/api/docs/      # Swagger
open http://localhost:8000/admin/         # Django Admin
open http://localhost:9001                # MinIO console (printhub / printhub-secret-key)
open http://localhost:8080                # Traefik dashboard
open http://localhost:5555                # Flower (Celery monitor)
```

L'API est exposée sur `http://localhost:8000/api/v1/` et via Traefik sur `http://api.printhub.local/` (ajouter dans `/etc/hosts`).

## Endpoints clés

| Méthode | URL | Description |
|--------|-----|-------------|
| POST | `/api/v1/auth/register/` | Inscription |
| POST | `/api/v1/auth/login/` | Connexion JWT (2FA si activé) |
| POST | `/api/v1/auth/token/refresh/` | Rafraîchir le token |
| POST | `/api/v1/auth/otp/request/` | Demande d'OTP (SMS/email) |
| POST | `/api/v1/auth/otp/verify/` | Vérification OTP |
| POST | `/api/v1/auth/2fa/setup/` | Activation 2FA TOTP |
| GET | `/api/v1/catalog/products/` | Catalogue |
| POST | `/api/v1/quote-requests/` | Créer une demande de devis |
| POST | `/api/v1/quote-requests/{id}/submit/` | Lancer le matching |
| GET | `/api/v1/quote-requests/{id}/offers/` | Voir les offres |
| POST | `/api/v1/orders/` | Créer une commande |
| POST | `/api/v1/payments/initiate/` | Initier paiement (Stripe/CinetPay/Wave/…) |
| POST | `/api/v1/payments/webhooks/cinetpay/` | Webhook CinetPay |
| GET | `/api/v1/production/jobs/` | Jobs production (imprimeur) |
| POST | `/api/v1/ai/bat-analyses/run/` | Analyse IA d'un BAT |
| POST | `/api/v1/assistant/conversations/{id}/send/` | Discuter avec l'assistant |
| GET | `/api/v1/dashboards/admin/` | Dashboard admin |
| GET | `/api/v1/dashboards/printer/` | Dashboard imprimeur |
| GET | `/api/v1/dashboards/customer/` | Dashboard client |

## WebSockets

- `ws://localhost:8001/ws/notifications/` — notifications temps réel
- `ws://localhost:8001/ws/orders/{order_id}/` — suivi commande
- `ws://localhost:8001/ws/production/{job_id}/` — production atelier
- `ws://localhost:8001/ws/chat/{conversation_id}/` — chat
- `ws://localhost:8001/ws/dashboards/{scope}/` — KPIs streaming

## Paiements supportés

| Provider | Pays / usage | Status |
|----------|--------------|--------|
| **CinetPay** | UEMOA — agrégateur Mobile Money + CB | Implémenté |
| **Wave** | CI / SN — Mobile Money low-fee | Implémenté |
| **Stripe** | International — CB + abonnements SaaS | Implémenté |
| Orange Money | UEMOA — direct | À implémenter |
| MTN MoMo | CEMAC + UEMOA — direct | À implémenter |
| Paystack | Nigeria + Ghana | À implémenter |
| Flutterwave | Pan-africain | À implémenter |

Le module `payments.providers` expose une interface `PaymentProvider` commune ; chaque nouvelle passerelle s'ajoute en quelques heures.

## IA multi-provider

Variable d'environnement `AI_BACKEND` :
- `openai` — OpenAI (GPT-4o, GPT-4o-mini)
- `anthropic` — Anthropic Claude
- `local` ou `ollama` — Modèles auto-hébergés (Llama, Mistral)
- `auto` — sélection automatique selon les clés API présentes

Chaque appel passe par `chat_with_audit()` qui trace coût, latence, tokens et erreurs.

## Tests

```bash
make test           # pytest + couverture
make lint           # ruff + black --check + mypy
make format         # auto-format
```

## Cible Afrique de l'Ouest

- Devise par défaut : **XOF** (Franc CFA BCEAO)
- Timezone par défaut : **Africa/Abidjan**
- Pays par défaut : **CI** (Côte d'Ivoire)
- Locale par défaut : **fr** (FR + EN supportés)
- Numéros au format E.164 (validation `phonenumber-field`)
- SMS via Africa's Talking (sandbox + production)
- WhatsApp Business API (Meta Cloud)
