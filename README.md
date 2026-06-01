# PrintHub

Plateforme SaaS panafricaine pour l'industrie de l'impression. Marketplace intelligente, ERP de production, CRM et moteur IA — conçu pour le marché Afrique de l'Ouest (UEMOA) avec extension future CEMAC et anglophone.

## Vue d'ensemble

```
PrintHub/
├── PrintHub_Documentation_Technique.docx   # 16 chapitres, 531 paragraphes, 30 tableaux
├── backend/                                # Django 5 + DRF + Channels + Celery (31 apps)
├── web/                                    # Next.js 15 + React 19 + TS + Tailwind + Shadcn
├── mobile/                                 # Flutter 3.24 + Riverpod + Dio + GoRouter
└── README.md
```

## Composants livrés

| Composant | Stack | Volume | Statut |
|-----------|-------|--------|--------|
| **Documentation technique** | DOCX | 16 chapitres, 30 tableaux | ✅ Livrée |
| **Backend** | Python 3.12, Django 5, DRF, PostgreSQL+PostGIS, Redis, Celery, Channels, MinIO | 357 fichiers, 8 382 lignes, 31 apps | ✅ Livré |
| **Frontend Web** | Next.js 15, React 19, TypeScript, Tailwind, Shadcn UI, TanStack Query, Zustand | 73 fichiers, 4 480 lignes | ✅ Livré |
| **Mobile** | Flutter 3.24, Riverpod, Dio, GoRouter, FCM, Hive | 49 fichiers, 4 213 lignes | ✅ Livré |
| **Total** | | **~17 075 lignes de code** | ✅ |

## Architecture macro

```
   ┌───────────────┐    ┌─────────────────┐    ┌──────────────┐
   │  Mobile       │    │  Web            │    │  Admin Web   │
   │  Flutter      │    │  Next.js 15     │    │  Next.js 15  │
   │  (3 rôles)    │    │  (Client+Prnt.) │    │  (Admin)     │
   └───────┬───────┘    └────────┬────────┘    └──────┬───────┘
           │                     │                    │
           └─────────────────────┼────────────────────┘
                                 │ HTTPS + WSS
                          ┌──────▼──────┐
                          │  Traefik    │ Reverse proxy + TLS
                          └──────┬──────┘
                                 │
            ┌────────────────────┼───────────────────────┐
            │                    │                       │
       ┌────▼────┐         ┌─────▼─────┐         ┌──────▼──────┐
       │  API    │         │  WS       │         │  Workers    │
       │ Django  │         │ Channels  │         │  Celery     │
       └────┬────┘         └─────┬─────┘         └──────┬──────┘
            │                    │                       │
            └────────────────────┼───────────────────────┘
                                 │
       ┌─────────────────┬───────┴─────────┬────────────────┐
       │                 │                 │                │
  ┌────▼────┐     ┌──────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
  │Postgres │     │   Redis    │    │   MinIO   │    │  Elastic  │
  │ +PostGIS│     │ Cache+WS+  │    │   S3      │    │  Search   │
  │         │     │  Celery    │    │           │    │           │
  └─────────┘     └────────────┘    └───────────┘    └───────────┘
```

## Démarrage rapide

```bash
# 1. Backend
cd backend
cp .env.example .env
make up            # docker compose up -d
make migrate
make createsuperuser
# → http://localhost:8000/api/docs/  (Swagger)
# → http://localhost:8000/admin/

# 2. Web (terminal 2)
cd web
cp .env.example .env.local
npm install
npm run dev
# → http://localhost:3000

# 3. Mobile (terminal 3)
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:8000
```

## Backend Django — 31 apps

| Catégorie | Apps |
|-----------|------|
| **Fondations** | core, accounts, authentication, organizations |
| **Marketplace** | printers, customers, catalog, pricing |
| **Cycle commande** | quote_requests, matching, orders, production |
| **Logistique** | logistics, delivery |
| **Argent** | payments, subscriptions, billing |
| **Relation client** | reviews, notifications, chat, support, crm |
| **IA** | ai_engine (multi-provider OpenAI/Anthropic/Ollama), ai_assistant |
| **Transverses** | audit, kyc, analytics, dashboards, workflows, documents, storage |

### Modules clés

- **`orders`** : machine à états FSM 18 statuts (django-fsm)
- **`matching`** : moteur multi-critères pondérés (prix, délai, distance, qualité, capacité)
- **`production`** : ERP atelier avec jobs, étapes, opérateurs, QR codes, incidents
- **`payments`** : interface `PaymentProvider` unifiée + Stripe, CinetPay, Wave (extensible Paystack/Flutterwave/OM/MoMo)
- **`ai_engine`** : abstraction `AIProvider` + audit complet (coût, latence, tokens)
- **`ai_assistant`** : 3 personas (client, imprimeur, admin) avec contextes système distincts

## Frontend Web — 4 espaces

| Espace | URLs | Rôle |
|--------|------|------|
| **Marketing** | `/` | Public |
| **Auth** | `/login`, `/register`, `/otp`, `/two-factor`, `/reset` | Tous |
| **Client** | `/dashboard`, `/catalog`, `/quotes`, `/orders`, `/account` | Client |
| **Imprimeur** | `/p/dashboard`, `/p/production` (Kanban), `/p/orders`, `/p/catalog`, `/p/billing`, `/p/team` | Imprimeur |
| **Admin** | `/a/dashboard`, `/a/users`, `/a/printers`, `/a/kyc`, `/a/orders`, `/a/finance` | Admin |

Dark/light mode automatique, i18n FR/EN, WebSockets pour suivi commande temps réel.

## Mobile Flutter — multi-rôles

- **Client** : dashboard, catalogue, configurateur, comparateur d'offres IA, suivi commande timeline.
- **Livreur** : tournée GPS continue (carte OpenStreetMap), preuve de livraison (photo + signature).
- **Agent atelier** : scan QR codes pour démarrer/terminer/incident sur les jobs.

JWT sécurisé (Keychain/EncryptedSharedPreferences), 2FA TOTP, OTP SMS/email/WhatsApp, FCM push, mode offline Hive.

## Spécificités Afrique de l'Ouest

- **Devise** : XOF (Franc CFA) par défaut
- **Paiements** : CinetPay, Wave, Orange Money, MTN MoMo, Moov, Stripe pour international
- **Pays cibles phase 1** : Côte d'Ivoire, Sénégal, Bénin (UEMOA)
- **Multilingue** : Français (défaut), Anglais
- **Conformité** : loi 2017-410 CI, loi 2008-12 SN, registre OHADA RCCM
- **Notifications** : Africa's Talking (SMS), WhatsApp Business Cloud API, FCM (push)
- **Cartographie** : OpenStreetMap (gratuit, couverture africaine optimale)

## Roadmap

Voir `PrintHub_Documentation_Technique.docx` — chapitre 15 :
- **Phase 1 (M1-M2)** : Fondations DevOps + auth — ✅ posées
- **Phase 2 (M3-M4)** : MVP marketplace (catalogue + devis + CinetPay + chat)
- **Phase 3 (M5-M7)** : Production + matching IA v1 + apps web/mobile
- **Phase 4 (M8-M10)** : IA BAT + assistants + Wave/Orange direct + tracking livreur
- **Phase 5 (M11-M12)** : Hardening + audit sécurité + soft launch Côte d'Ivoire

## Conventions

- **Branches** : `main` (prod), `staging`, `feature/<ticket>-<slug>`
- **Commits** : conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Code review** : 1 reviewer minimum, CI verte obligatoire
- **Code style** : Ruff + Black (Python), ESLint + Prettier (TS), very_good_analysis (Dart)
- **Typage strict** partout : `mypy --strict`, `tsc --strict`, `analysis_options.yaml strict-casts`

## Licences

Propriétaire — © PrintHub 2026.
# nakoa
