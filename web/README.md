# PrintHub — Web

Frontend Next.js 15 + React 19 + TypeScript de la plateforme PrintHub.

## Stack

- **Next.js 15** (App Router, Server Components, Turbopack en dev)
- **React 19** + **TypeScript** strict
- **Tailwind CSS 3** + **Shadcn UI** (composants Radix)
- **TanStack Query 5** (cache serveur, refetch intelligent)
- **Zustand** (état global léger, persist auth)
- **React Hook Form** + **Zod** (formulaires typés)
- **Framer Motion** (animations premium)
- **Recharts** (charts dashboards)
- **next-intl** (i18n FR / EN)
- **next-themes** (dark / light auto)
- **Sonner** (toasts)
- **Axios** (client HTTP avec interceptors JWT)

## Structure

```
web/
├── app/                              # App Router
│   ├── (marketing)/                  # / (landing)
│   ├── (auth)/                       # /login, /register, /otp, /reset, /two-factor
│   ├── (customer)/                   # /dashboard, /catalog, /quotes, /orders, /account
│   ├── (printer)/p/                  # /p/dashboard, /p/production, /p/orders…
│   ├── (admin)/a/                    # /a/dashboard, /a/users, /a/kyc, /a/finance…
│   └── layout.tsx                    # Layout racine + Providers
├── components/
│   ├── ui/                           # Shadcn primitives (Button, Card, Input…)
│   ├── layout/                       # Site/App header, sidebar, topbar
│   ├── domain/                       # KpiCard, DataTable, OrderStatusBadge
│   ├── charts/                       # PrintHubAreaChart, Donut
│   └── providers.tsx                 # QueryClient + ThemeProvider + Toaster
├── lib/
│   ├── api/                          # client.ts (axios + interceptors), types.ts, endpoints
│   ├── i18n/                         # request config next-intl
│   └── utils.ts                      # cn, formatCurrency, formatDate…
├── hooks/                            # use-auth, use-orders, use-catalog, use-dashboards, use-websocket
├── stores/                           # auth (persist), ui (sidebar)
├── i18n/messages/                    # fr.json, en.json
├── middleware.ts                     # Protection routes auth
├── tailwind.config.ts                # Design tokens + variants
├── tsconfig.json                     # strict + path aliases @/*
├── next.config.mjs                   # next-intl + image domains + rewrites API
├── Dockerfile                        # Multi-stage build production
└── package.json
```

## Démarrage rapide

```bash
# 1. Installer les dépendances
cp .env.example .env.local
npm install

# 2. Lancer en mode dev
npm run dev
open http://localhost:3000
```

Le backend Django doit tourner sur `http://localhost:8000`. Les requêtes `/api/v1/*` sont automatiquement proxifiées (voir `next.config.mjs`).

## Pages livrées

### Public
- `/` — Landing premium (hero, features, stats, pricing, CTA)

### Auth
- `/register` — Inscription multi-rôles (client / imprimeur / livreur)
- `/login` — Connexion JWT avec 2FA TOTP
- `/otp` — Vérification OTP (SMS / email / WhatsApp)
- `/reset` — Réinitialisation mot de passe en 2 étapes
- `/two-factor` — Activation 2FA TOTP avec backup codes

### Espace Client
- `/dashboard` — KPIs + dernières commandes
- `/catalog` — Catalogue avec filtres par catégorie
- `/catalog/[slug]` — Détail produit + configurateur + demande de devis
- `/quotes` — Liste des devis
- `/quotes/[id]` — Comparateur d'offres (recommandée IA, meilleur prix, plus rapide)
- `/orders` — Historique commandes
- `/orders/[id]` — Suivi commande temps réel avec timeline (WebSocket)
- `/account` — Profil + sécurité

### Espace Imprimeur (`/p/*`)
- `/p/dashboard` — KPIs, charts d'activité, performance atelier
- `/p/production` — **Vue Kanban** des jobs (queued → in_progress → done)
- `/p/orders` — Commandes attribuées
- `/p/orders/[id]` — Détail + actions (accepter, démarrer production, refuser)
- `/p/catalog` — Catalogue & grilles tarifaires
- `/p/billing` — Wallet + retraits Mobile Money
- `/p/team` — Gestion équipe

### Back-office Admin (`/a/*`)
- `/a/dashboard` — GMV, charts hebdo, répartition statuts
- `/a/users` — Annuaire utilisateurs avec filtres
- `/a/printers` — Atelier partenaires + scores
- `/a/kyc` — Modération KYC / KYB (approuver / rejeter)
- `/a/orders` — Vue globale commandes
- `/a/finance` — Revenus, commission, payouts, répartition providers

## Design system

- **Couleurs** : Primary `#1F3A5F` (deep blue), Accent `#10B981` (green), tokens HSL via CSS variables
- **Typographie** : Inter (sans), Sora (display)
- **Radius** : 0.75rem
- **Dark mode** : automatique via `next-themes`, toggle dans le topbar
- **Animations** : transitions Tailwind + Framer Motion sur les listes/cartes
- **Responsive** : mobile-first, breakpoints sm/md/lg/xl/2xl

## Authentification

- JWT (access 15min + refresh 30j) stocké via Zustand `persist`
- Auto-refresh transparent dans l'intercepteur Axios
- Support 2FA TOTP (Google Authenticator) + codes de secours
- Vérification OTP SMS / email / WhatsApp
- Middleware Next.js protège les routes authentifiées

## WebSockets

Le hook `useWebSocket` se connecte au backend (`NEXT_PUBLIC_WS_URL`) pour :
- Suivi commande en direct (`/ws/orders/{id}/`)
- Production atelier (`/ws/production/{job_id}/`)
- Chat client/imprimeur (`/ws/chat/{conv_id}/`)
- Notifications push (`/ws/notifications/`)

## Build production

```bash
npm run build
npm run start
```

Ou via Docker :

```bash
docker build -t printhub-web .
docker run -p 3000:3000 --env-file .env printhub-web
```

## Scripts

- `npm run dev` — Dev server avec Turbopack
- `npm run build` — Build production
- `npm run start` — Serveur production
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
- `npm run format` — Prettier

## Variables d'environnement

Voir `.env.example` :
- `NEXT_PUBLIC_API_URL` — URL du backend Django (défaut `http://localhost:8000`)
- `NEXT_PUBLIC_WS_URL` — WebSocket Channels (défaut `ws://localhost:8001`)
- `NEXT_PUBLIC_APP_URL` — URL publique du site
- `NEXT_PUBLIC_DEFAULT_LOCALE` — `fr` par défaut
- `NEXT_PUBLIC_DEFAULT_CURRENCY` — `XOF` par défaut
- `NEXT_PUBLIC_DEFAULT_COUNTRY` — `CI` par défaut

## Statistiques

- **73 fichiers TS/TSX** — ~4 480 lignes
- **26 composants** (UI + domain + layout + charts)
- **20+ pages** réparties en 4 espaces fonctionnels
- **7 hooks** typés alignés sur l'API Django
- **Dark / Light mode** intégré dès le départ
- **i18n FR / EN** prêt à étendre
