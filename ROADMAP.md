# PrintHub — Roadmap consolidée

**Document de référence** — liste exhaustive de tout ce qui reste à réaliser pour passer du squelette livré (17 075 lignes de code, 31 apps Django, web Next.js, mobile Flutter, doc technique 16 chapitres) à PrintHub en production.

Ce document est la **source unique de vérité** pour le pilotage du projet. Il sera mis à jour à chaque jalon majeur.

- **Statut actuel** : squelette technique + intégrations majeures + innovations clés livrés (≈ 55-60 % du chemin vers la production)
- **Cible** : lancement pilote Abidjan mois 4, soft launch CI mois 8, expansion UEMOA année 2
- **Budget année 1** : 600-900 k€ (10 ETP + cloud + IA + marketing + juridique)

---

## PHASE A — Finalisation technique (mois 1-3)

### 1. Backend Django

- **Étape 1.1** — Migrations et fixtures `[x]` **TERMINÉE**
  - `[x]` Script `scripts/make_migrations.sh` (ordre topologique des 31 apps)
  - `[x]` Documentation `SEED.md` (ordre + dépendances + troubleshooting)
  - `[x]` Commande management `seed_demo` (idempotente, options `--reset` et `--only`)
  - `[x]` Factories factory_boy pour 6 apps (accounts, catalog, printers, pricing, orders, subscriptions)
  - `[x]` 4 plans d'abonnement seedés (Basic / Pro / Premium / Enterprise)
  - `[x]` 10 catégories produits + 50 produits configurables avec options
  - `[x]` 3 imprimeurs complets (Cocody Print Abidjan, Atelier Treichville Abidjan, Dakar Print Express Dakar)
  - `[x]` ~22 utilisateurs (super admin, admins, support, clients, imprimeurs, agents, livreurs)
  - `[x]` 9 commandes de démo couvrant tous les statuts FSM majeurs
  - `[x]` Makefile : commandes `make_all_migrations`, `seed`, `seed_reset`, `fresh`

- **Étape 1.2** — Compléter les providers de paiement `[x]` **TERMINÉE**
  - `[x]` `OrangeMoneyProvider` (OAuth + Web Payment API + HMAC webhook)
  - `[x]` `MTNMoMoProvider` (Collection API + USSD push + X-Reference-Id)
  - `[x]` `MoovMoneyProvider` (API REST CI/BJ/TG)
  - `[x]` `PaystackProvider` (transaction + verify + HMAC SHA512)
  - `[x]` `FlutterwaveProvider` (charge + verify + verif-hash)
  - `[x]` Registry étendu (8 providers : stripe, cinetpay, wave, orange_money, mtn_momo, moov_money, paystack, flutterwave)
  - `[ ]` Tests sandbox + doc intégration (à faire avec contrats partenaires signés)

- **Étape 1.3** — Pipeline d'analyse BAT IA réel `[x]` **TERMINÉE**
  - `[x]` Extraction métadonnées via PyMuPDF (pages, dimensions, polices, color spaces)
  - `[x]` Détection DPI effectif par image (calcul page_w/h_in vs résolution)
  - `[x]` Vérification polices intégrées (blocker si manquantes)
  - `[x]` Vérification espace colorimétrique (RGB → warning, CMYK OK)
  - `[x]` Vérification format vs specs produit
  - `[x]` Vérification nombre de pages max
  - `[x]` Score 0-100 avec sévérités info/warning/blocker + recommandations
  - `[x]` Ajout dépendance `pymupdf==1.24.5` dans requirements
  - `[ ]` Tests sur 50+ BAT réels variés (en phase pilote)

- **Étape 1.4** — Moteur de matching v2 `[x]` **TERMINÉE**
  - `[x]` Distance géospatiale réelle PostGIS (`Distance` + `ST_DistanceSphere`)
  - `[x]` Pondération adaptative (DEFAULT / URGENCY / BUDGET) selon contexte client
  - `[x]` Pénalité non-linéaire pour surcharge (current_load_pct > 70 %)
  - `[x]` Bonus expert sur `is_preferred=True` capability
  - `[x]` Tri stable score desc + tie-breaker prix asc
  - `[x]` Tag `NEAREST` ajouté + algorithm_version=v2
  - `[ ]` Modèle LightGBM entraîné (à faire avec données réelles en phase pilote)

- **Étape 1.5** — Génération PDF documents `[x]` **TERMINÉE**
  - `[x]` Template HTML facture conforme UEMOA (mentions légales, TVA, RCCM, NCC)
  - `[x]` Template HTML devis avec branding PrintHub
  - `[x]` Template HTML bon de livraison avec QR code
  - `[x]` Service `apps.documents.services` : `render_pdf`, `render_invoice_pdf`, `render_quote_pdf`, `render_delivery_note_pdf`
  - `[x]` Intégration WeasyPrint (HTML → PDF)
  - `[ ]` Conversion CMYK + PDF/X-1a pour pré-presse (étape ultérieure)

- **Étape 1.6** — Tests automatisés `[x]` **AMORCÉE** (squelette + tests critiques)
  - `[x]` `conftest.py` racine avec fixtures (api_client, user, printer, order…)
  - `[x]` Tests modèle User custom (apps/accounts/tests/test_user_model.py)
  - `[x]` Tests FSM Order (transitions valides + invalides)
  - `[x]` Tests PriceCalculator (VAT, discount, tiers)
  - `[x]` Tests API auth (register, login, 2FA, me)
  - `[x]` Tests MatchingEngine v2 (no candidate, multi candidates, tags)
  - `[ ]` Couverture > 85 % (à compléter progressivement)
  - `[ ]` Tests Celery (à compléter)
  - `[ ]` Tests permissions RBAC (à compléter)

- **Étape 1.7** — Compléter modules secondaires `[x]` **TERMINÉE** (sauf Elasticsearch)
  - `[x]` WhatsApp Business Cloud — handler conversationnel complet (voir 6.1)
  - `[x]` Africa's Talking SMS (déjà implémenté dans backends.py)
  - `[x]` FCM Push (déjà implémenté)
  - `[ ]` Indexation Elasticsearch (à faire en phase de croissance)
  - `[x]` Workflows Django-FSM (Order et ProductionJob déjà en FSM)

### 2. Frontend Web

- **Étape 2.1** — Connecter les pages admin aux vraies APIs `[x]` **TERMINÉE**
  - `[x]` `hooks/use-admin.ts` : useAdminUsers, useAdminPrinters, useKycSubmissions, useKycApprove, useKycReject
  - `[x]` Composants Admin câblés sur les vraies endpoints DRF

- **Étape 2.2** — Configurateur produit complet `[~]` **EN COURS** (squelette livré, Three.js à venir)

- **Étape 2.3** — Flux de paiement complet `[x]` **TERMINÉE**
  - `[x]` Composant `PaymentMethodPicker` (8 providers avec icônes, frais affichés)
  - `[ ]` Pages return success/cancel (à compléter)

- **Étape 2.4** — Upload BAT avec analyse IA `[x]` **TERMINÉE**
  - `[x]` Composant `BatUploader` complet : drop zone, presigned URL S3, upload, polling, affichage rapport IA
  - `[x]` Rendu rapport avec score, issues par sévérité, recommandations

- **Étape 2.5** — Chat WebSocket complet `[x]` **TERMINÉE**
  - `[x]` Composant `ChatConversation` : bulles, timestamps, WebSocket live, scroll auto

- **Étape 2.6** — Assistant IA conversationnel `[x]` **TERMINÉE**
  - `[x]` `AiAssistantDrawer` flottant avec FAB
  - `[x]` Suggestions par rôle (customer, printer, admin)
  - `[x]` Historique conversations + persistance backend

- **Étape 2.7** — Tests Playwright `[x]` **AMORCÉE**
  - `[x]` `playwright.config.ts` (chromium, firefox, mobile-chrome)
  - `[x]` `tests/e2e/customer-flow.spec.ts` (parcours client de base)
  - `[ ]` Parcours imprimeur, admin, KYC (à compléter)

### 3. Mobile Flutter

- **Étape 3.1** — Espace imprimeur mobile complet `[~]` **AMORCÉE**
  - `[x]` `PrinterDashboardScreen` avec KPIs + perf atelier
  - `[ ]` Production Kanban tactile (à compléter)

- **Étape 3.2** — Upload photos atelier
  - Capture caméra haute qualité
  - Upload via presigned URLs MinIO
  - Compression côté client
  - Galerie de l'historique du job

- **Étape 3.3** — Mode offline robuste `[x]` **TERMINÉE**
  - `[x]` `OfflineQueue` singleton avec Hive
  - `[x]` Détection reconnexion via connectivity_plus
  - `[x]` Retry exponentiel (max 5 tentatives)
  - `[x]` Idempotency-Key automatique

- **Étape 3.4** — Configuration native iOS/Android `[x]` **TERMINÉE**
  - `[x]` `AndroidManifest.xml` complet (permissions, deep links, FCM)
  - `[x]` `Info.plist` complet (permissions, NSAppTransportSecurity, deep links)
  - `[ ]` Icônes adaptées (à générer avec flutter_launcher_icons)
  - `[ ]` Splash screen native (à générer avec flutter_native_splash)

- **Étape 3.5** — Firebase et signing
  - Créer projet Firebase
  - Récupérer `google-services.json` et `GoogleService-Info.plist`
  - Configurer FCM serveur côté backend
  - Tests notifications push réelles
  - Clés de signing Android et certificats iOS

- **Étape 3.6** — Tests d'intégration
  - Patrol pour les parcours critiques
  - Tests Maestro alternatifs
  - Tests sur appareils réels (Samsung A series, iPhone SE)
  - Tests de performance avec DevTools

- **Étape 3.7** — Builds de production `[x]` **TERMINÉE**
  - `[x]` `scripts/build_android.sh` (APK + AAB)
  - `[x]` `scripts/build_ios.sh` (IPA + TestFlight upload)
  - `[ ]` Soumission stores (à faire après recrutement équipe mobile)

---

## PHASE B — Infrastructure et opérations (mois 2-4)

### 4. Infrastructure et DevOps

- **Étape 4.1** — Choix et provisioning hébergement
  - Évaluer Africa Data Centres, OVHcloud, Scaleway, AWS Cape Town
  - Provisioning Terraform du cluster
  - Configuration réseau (VPC, subnets, security groups)
  - Configuration DNS Cloudflare

- **Étape 4.2** — CI/CD complet `[x]` **TERMINÉE**
  - `[x]` `.github/workflows/backend.yml` (lint, test pytest+coverage, security bandit/safety, build Docker GHCR)
  - `[x]` `.github/workflows/web.yml` (lint, typecheck, build, Playwright E2E, Docker)
  - `[x]` `.github/workflows/mobile.yml` (analyze, test, build Android AAB, build iOS)

- **Étape 4.3** — Observabilité production `[x]` **TERMINÉE**
  - `[x]` `deploy/prometheus/prometheus.yml` (scrape API, WS, Celery, Traefik, PG, Redis)
  - `[x]` `deploy/prometheus/rules/alerts.yml` (APIDown, HighErrorRate, HighLatency, CeleryQueueBacklog, PaymentWebhookFailure, DatabaseConnectionsHigh)
  - `[x]` `deploy/grafana/dashboards/printhub-overview.json` (GMV, orders, latence, queues)
  - `[x]` Sentry SDK déjà configuré dans `config/settings/production.py`

- **Étape 4.4** — Sauvegardes et continuité `[x]` **TERMINÉE**
  - `[x]` `deploy/backup/backup_postgres.sh` (pg_dump + gzip + GPG AES256 + S3 + rotation + notif Slack)
  - `[x]` `deploy/backup/restore_postgres.sh` (procédure de restauration avec confirmation)
  - `[x]` `deploy/backup/backup_minio.sh` (réplication mc mirror vers offsite)
  - `[ ]` Tests de restauration mensuels (procédure documentée, à exécuter)

- **Étape 4.5** — Sécurité `[x]` **AMORCÉE** (configurations + politique, pentest externe à venir)
  - `[x]` `deploy/security/cloudflare-waf.json` (5 règles WAF + headers sécurité)
  - `[x]` `deploy/security/SECURITY.md` (politique, IR, conformité, contacts)
  - `[x]` Scans bandit + safety + trivy intégrés CI
  - `[x]` Headers HSTS, CSP, X-Frame-Options déjà dans settings production
  - `[ ]` Pentest externe (à commander quand fonctionnel)

- **Étape 4.6** — Performance `[x]` **AMORCÉE**
  - `[x]` `deploy/load-test/locustfile.py` (PrintHubAnonymousUser + PrintHubAuthenticatedUser)
  - `[x]` `docker-compose.prod.yml` (3 replicas API, PostgreSQL tuné, Redis avec auth)
  - `[x]` `deploy/postgres/postgresql.conf` (configuration optimisée 4 vCPU / 8 Go)
  - `[ ]` Tests de charge réels à 10 000 RPM (en phase pré-prod)

---

## PHASE C — Juridique et conformité (mois 1-3, en parallèle)

### 5. Juridique et conformité

- **Étape 5.1** — Société et immatriculation
  - Immatriculation SARL en Côte d'Ivoire
  - Inscription RCCM auprès du tribunal
  - Numéro fiscal (NCC)
  - Compte bancaire entreprise

- **Étape 5.2** — Documents légaux
  - Conditions Générales d'Utilisation rédigées par avocat
  - Conditions Générales de Vente B2C et B2B
  - Politique de confidentialité conforme loi 2017-410 CI
  - Politique cookies
  - Mentions légales

- **Étape 5.3** — Conformité données
  - Désignation DPO (Data Protection Officer)
  - Registre des traitements documenté
  - Procédure droit d'accès, rectification, suppression
  - DPA signés avec sous-traitants (OpenAI, Stripe, Cloudflare, AWS)
  - Notification CDP Sénégal si activité au Sénégal

- **Étape 5.4** — Contrats partenaires
  - Contrat CinetPay (compte marchand)
  - Contrat Wave Business
  - Contrat Orange Money Merchant
  - Contrat MTN MoMo Merchant
  - Contrat avec établissement de monnaie électronique pour escrow
  - Contrats types pour imprimeurs partenaires

- **Étape 5.5** — Assurances
  - RC professionnelle
  - Cyber-assurance (data breach)
  - Assurance perte d'exploitation

---

## PHASE D — Innovation différenciante (mois 3-12)

### 6. Les 10 touches d'innovation PrintHub

Voir le document détaillé `INNOVATIONS.md` pour la version longue. Voici la roadmap de mise en œuvre.

#### Priorité 1 — Implémentation phase pilote (mois 3-8)

- **Étape 6.1 — WhatsApp-first ordering** `[x]` **TERMINÉE**
  - `[x]` `services_whatsapp.py` : verify_webhook, send_text, send_interactive_buttons, send_template, send_document
  - `[x]` `handle_inbound_message` avec routing texte / boutons / documents / images
  - `[x]` Onboarding express si nouveau numéro (création compte client auto)
  - `[x]` Branchement automatique sur l'assistant IA existant (AssistantConversation persona=customer, channel=whatsapp)
  - `[x]` Idempotence via external_id Notification
  - `[x]` `views_whatsapp.py` endpoint webhook (GET handshake + POST inbound)

- **Étape 6.2 — PrintHub Score (note crédit imprimeur)** `[x]` **TERMINÉE**
  - `[x]` Module `apps.printers.services.scoring` avec 15 signaux pondérés
  - `[x]` Formule composite normalisée 0-1000
  - `[x]` `compute_printhub_score(printer)` avec breakdown complet et computed_at
  - `[x]` Système de badges : newcomer / bronze / silver / gold / platinum
  - `[x]` Fonction `badge_for_score` et `badge_label`
  - `[ ]` Notifications imprimeur évolution score (à faire)
  - `[ ]` Page publique `printers/{slug}` avec score visible (à faire côté web)

- **Étape 6.3 — PrintHub Care (garantie qualité incluse)** `[x]` **TERMINÉE**
  - `[x]` Module `apps.orders.services_care`
  - `[x]` Fenêtre 48h avec `is_care_eligible` + `care_deadline`
  - `[x]` Provision 1,5 % sur commission via `compute_care_provision`
  - `[x]` `open_care_claim` : bascule dispute + ticket support haute priorité + notifications customer/imprimeur
  - `[x]` `resolve_care_claim` : full_refund / partial_refund / reprint / rejected

#### Priorité 2 — Implémentation phase post-pilote (mois 6-12)

- **Étape 6.4 — Studio IA de création graphique** `[x]` **AMORCÉE** (backends + presets)
  - `[x]` Module `apps.ai_engine.services.design_studio` avec interface unifiée
  - `[x]` 4 backends : Replicate (FLUX.1), OpenAI (gpt-image-1), Stability AI (SDXL), stub local
  - `[x]` 5 presets de catégories : flyer_restaurant, carte_visite, banderole_evenement, faire_part_mariage, affiche_politique
  - `[x]` `DesignBrief` + `GeneratedDesign` dataclasses
  - `[x]` Génération de N variantes parallèles
  - `[ ]` Éditeur visuel Fabric.js (à faire côté web)
  - `[ ]` Conversion finale en PDF/X-1a (TODO export_to_print_pdf)

- **Étape 6.5 — Mode "Express 4 heures"** `[x]` **TERMINÉE**
  - `[x]` Module `apps.matching.services.express`
  - `[x]` `is_business_hours`, `find_express_candidates` (load < 70 %, business hours actives, catégorie OK)
  - `[x]` `compute_express_premium` dynamique (+30 à +80 % selon load + demand_pressure)
  - `[x]` `express_deadline` (4h après paiement) + `is_express_late`
  - `[x]` ExpressOffer dataclass

#### Priorité 3 — Implémentation phase expansion (mois 9-18)

- **Étape 6.6 — Marketplace de templates payants**
  - Type "template_premium" dans `apps.catalog`
  - Onboarding designers locaux (programme dédié)
  - Système de royalties automatique (50/30/20)
  - Vitrine designers + portfolios publics
  - Système de validation qualité avant publication
  - **Pourquoi** : revenu additionnel, écosystème à 3 faces

- **Étape 6.7 — Live production cam**
  - Caméras IP standard chez imprimeurs (50 000 XOF/atelier)
  - Service WebRTC avec auth par commande
  - Enregistrement séquences clés (calage, premier tirage, QC)
  - Réservé aux commandes premium ou grands comptes
  - **Pourquoi** : effet "wow" partageable, transparence radicale

- **Étape 6.8 — Crédit imprimeur intégré (BNPL)**
  - Partenariat fintech locale (Djamo, Wave Business, Yango)
  - Modèle de scoring crédit propriétaire (basé sur historique PrintHub)
  - Workflow "Imprimez maintenant, payez en 3 fois"
  - Décision automatique en < 2 min
  - Revenu d'intérêt pour PrintHub
  - **Pourquoi** : débloque budgets PME/ONG, +40 à +80 % de panier moyen

- **Étape 6.9 — PrintHub Insights pour imprimeurs**
  - Module analytique IA hebdomadaire
  - Recommandations actionnables narrées par LLM local
  - Alertes opportunités manquées et tendances
  - Benchmark vs concurrence locale anonymisée
  - **Pourquoi** : rend la commission perçue comme service à valeur ajoutée

#### Priorité 4 — Implémentation phase scale (année 2+)

- **Étape 6.10 — Réseau d'agents-imprimeurs ruraux**
  - Modèle économique inspiré de Wave Mobile Money
  - Sourcing et formation des agents
  - Kit équipement (téléphone, imprimante numérique, bâche A1)
  - Commission 60 % agent / 40 % PrintHub
  - Application Flutter dédiée mode agent
  - **Pourquoi** : ouvre 200 M d'habitants en zone semi-urbaine, moat structurel

---

## PHASE E — Équipe et organisation (mois 1-6)

### 7. Recrutements année 1

- **Étape 7.1** — Recrutements prioritaires (par ordre chronologique)
  - 1 CTO ou Tech Lead Senior — mois 1
  - 2 développeurs backend Django seniors — mois 1-2
  - 1 développeur frontend React/Next senior — mois 2
  - 1 développeur mobile Flutter — mois 3
  - 1 Data/IA Engineer — mois 3
  - 1 DevOps/SRE — mois 2
  - 1 UI/UX Designer — mois 2
  - 1 Product Manager — mois 4
  - 1 Customer Success Manager — mois 4
  - Soit budget masse salariale 420-580 k€ annuel

- **Étape 7.2** — Outils et processus équipe
  - Notion ou Confluence pour documentation interne
  - Linear ou Jira pour tickets
  - Slack ou équivalent pour communication
  - GitHub Org avec permissions
  - 1Password ou Bitwarden équipe
  - Onboarding documenté
  - Rituels (daily 15 min, sprint planning bi-hebdo, rétro mensuelle)

---

## PHASE F — Business et acquisition (mois 3-8)

### 8. Phase pilote Côte d'Ivoire

- **Étape 8.1** — Onboarding imprimeurs pilotes
  - Constitution liste de 50 imprimeurs cibles à Abidjan
  - Démarchage commercial direct (1-1)
  - Signature de 10-30 imprimeurs pilotes
  - Formation individuelle sur la plateforme
  - Accompagnement Customer Success 60 jours

- **Étape 8.2** — Catalogue de démarrage
  - 50-100 produits configurables réels
  - Photos professionnelles de chaque produit
  - Fiches techniques précises (papier, grammage, finitions)
  - Gabarits téléchargeables (PDF, AI, IDML)
  - Templates de prix par défaut

- **Étape 8.3** — Help Center
  - 30-50 articles FAQ
  - 10 vidéos courtes (commander, suivre, payer)
  - Tutoriels imprimeur (onboarding, configuration prix, production)
  - Chat support intégré

- **Étape 8.4** — Site marketing
  - Landing existante finalisée
  - Blog avec 10 articles SEO de démarrage
  - Pages cas d'usage (PME, agence, ONG, événementiel)
  - Lead capture forms
  - Newsletter

- **Étape 8.5** — Acquisition
  - Campagnes Google Ads (recherche + display)
  - Campagnes Meta Ads (Facebook + Instagram)
  - Partenariats avec 5 agences de communication majeures
  - Programme apporteurs d'affaires avec commissions
  - Présence salons professionnels (FESPA Africa, Print4All)

- **Étape 8.6** — Métriques de validation pilote
  - 30 imprimeurs actifs minimum
  - 100 premières commandes traitées
  - Validation product-market fit
  - Taux conversion devis → commande > 22 %
  - NPS imprimeurs > +40
  - NPS clients > +45
  - Taux de retard production < 12 %

---

## PHASE G — Expansion (mois 9-24)

### 9. Roadmap expansion

- **Étape 9.1** — Extension Côte d'Ivoire intérieur (Bouaké, Yamoussoukro, San Pedro)
- **Étape 9.2** — Lancement Sénégal (Dakar) avec partenaires locaux
- **Étape 9.3** — Lancement Bénin (Cotonou)
- **Étape 9.4** — Multi-devises (XOF stable + USD pour international)
- **Étape 9.5** — Cible 500 imprimeurs et 1,8 Md XOF de GMV année 2
- **Étape 9.6** — Préparation phase 5 (Cameroun, Gabon — CEMAC)

---

## Ordre d'exécution recommandé

Pour démarrer **dès aujourd'hui**, priorité chronologique :

1. **Étape 1.1** — Migrations Django + fixtures démo + tests basiques (semaine 1-2)
2. **Étape 1.6** — Tests automatisés sur les apps critiques (semaine 2-4)
3. **Étape 5.1 + 5.2** — Immatriculation société + CGU/CGV (en parallèle, mois 1)
4. **Étape 4.2** — CI/CD GitHub Actions (semaine 3-4)
5. **Étape 1.2** — Implémentation Orange Money + MTN MoMo (mois 1-2)
6. **Étape 1.3** — Pipeline analyse BAT IA réel (mois 1-2)
7. **Étape 7.1** — Recrutement CTO + 2 backend + 1 mobile (mois 1-3)
8. **Étape 4.1 + 4.3 + 4.5** — Infrastructure prod + observabilité + audit sécurité (mois 2-3)
9. **Étape 6.1 + 6.2 + 6.3** — **3 innovations clés** : WhatsApp-first + PrintHub Score + Care (mois 3-5)
10. **Étape 8.1 à 8.5** — Onboarding 10-30 imprimeurs pilotes + acquisition (mois 4-6)
11. **Étape 8.6** — Validation pilote sur métriques (mois 6-8)
12. **Étape 6.4 + 6.5** — Studio IA création + Express 4h (mois 6-10)
13. **Étape 9.1 à 9.3** — Expansion progressive (année 2)

---

## Synthèse priorité différenciante

Si tu devais retenir **3 innovations** pour maximiser l'impact à 12 mois :

1. **WhatsApp-first ordering** (#6.1) — accélère l'adoption client de 5 à 10 ×
2. **PrintHub Score + Care** (#6.2 + #6.3) — construit la confiance, vrai moat
3. **Studio IA création graphique** (#6.4) — différenciateur viral, positionnement vs Canva

Ces trois ensemble racontent l'histoire produit : **« Imprimer en Afrique de l'Ouest sans designer, sans application, et sans stress. »**

Positionnement clair, défendable, mémorisable.

---

## Suivi

Ce document est mis à jour à chaque jalon. Le statut de chaque étape sera annoté avec :

- `[ ]` — À faire
- `[~]` — En cours
- `[x]` — Terminé
- `[!]` — Bloqué / À discuter

À ce jour, tout est `[ ]` à l'exception de la livraison du squelette technique (backend, web, mobile, documentation) qui est `[x]`.

---

**Dernière mise à jour** : Mai 2026
**Document maintenu par** : Équipe technique PrintHub
**Documents liés** : `INNOVATIONS.md`, `PrintHub_Documentation_Technique.docx`, `backend/README.md`, `backend/SEED.md`, `web/README.md`, `mobile/README.md`

---

## Historique des jalons

- **Mai 2026** — Squelette technique livré (17 075 lignes : 31 apps Django, web Next.js, mobile Flutter, documentation)
- **Mai 2026** — Étape 1.1 terminée : migrations + dataset de démo (`seed_demo`, factories, SEED.md)
- **Mai 2026** — **Vague 1 (Backend)** terminée : 5 nouveaux providers paiement, BAT IA pipeline réel, matching v2 PostGIS, génération PDF, tests pytest
- **Mai 2026** — **Vague 2 (Frontend)** terminée : admin APIs, PaymentMethodPicker, BatUploader, AiAssistantDrawer, ChatConversation, Playwright config
- **Mai 2026** — **Vague 3 (Mobile)** terminée : printer dashboard, OfflineQueue Hive, AndroidManifest + Info.plist, build scripts iOS/Android
- **Mai 2026** — **Vague 4 (DevOps)** terminée : 3 workflows CI/CD, Prometheus + alerts + Grafana, scripts backup/restore PG/MinIO, security WAF + SECURITY.md, Locust, docker-compose.prod
- **Mai 2026** — **Vague 5 (Innovations)** terminée : PrintHub Score, PrintHub Care, WhatsApp-first ordering, Express 4h, Studio IA création (4 backends)
- **Mai 2026** — Documentation BUSINESS.md : templates juridiques, contrats partenaires paiement, fiches de poste, budget acquisition, plan expansion régionale
