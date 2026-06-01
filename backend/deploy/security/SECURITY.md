# PrintHub — Politique de sécurité opérationnelle

## Périmètre

- Backend Django (API + WebSockets + workers Celery)
- Frontend Next.js
- Application mobile Flutter
- Bases : PostgreSQL, Redis, MinIO, Elasticsearch
- Infrastructure : Traefik, Docker, Kubernetes (à venir)

## Mesures en place

### Authentification et autorisation
- JWT signés HS256 / RS256 avec rotation des refresh tokens
- 2FA TOTP obligatoire pour rôles admin
- Argon2id pour hashage mots de passe (250 ms calibration)
- OTP SMS/email avec rate limit (3 demandes / 5 min)
- Verrouillage progressif comptes après 5 échecs (1, 5, 30 min, 24h)
- RBAC + django-guardian pour permissions par objet

### Transport et stockage
- HTTPS obligatoire (HSTS 1 an, preload)
- TLS 1.3 sur Traefik + Cloudflare
- mTLS prévu pour communications inter-services
- Chiffrement au repos : disques LUKS, MinIO SSE, secrets dans Vault
- Sauvegardes chiffrées GPG AES256, upload offsite

### Application
- CSRF protection sur vues mutantes hors API JWT
- CSP stricte (voir cloudflare-waf.json)
- Rate limiting via django-ratelimit + Traefik + Cloudflare
- Validation MIME stricte + scan antivirus ClamAV sur uploads
- ORM Django paramétré, requêtes SQL brutes auditées
- Audit logs immuables (table audit_log) sur opérations sensibles

### Monitoring
- Sentry pour erreurs et release tracking
- Prometheus + Grafana pour métriques techniques et métier
- Loki pour logs centralisés avec rétention 90 jours
- Alerting Slack/email (P1 page on-call, P2 Slack équipe, P3 digest)

## Procédure incident response

### Détection
- Alerte Prometheus déclenchée → notification Slack + email
- Sentry erreurs > seuil → notification Slack
- Audit logs anomalies → revue quotidienne

### Triage (15 minutes)
1. Confirmer la sévérité (P1/P2/P3)
2. Créer un canal Slack dédié `#incident-YYYYMMDD-HHMM`
3. Désigner un Incident Commander
4. Notifier les parties prenantes selon la sévérité

### Mitigation
1. Identifier la cause root via logs Loki et traces OpenTelemetry
2. Appliquer le rollback si déploiement récent
3. Activer le maintenance mode si nécessaire (Traefik middleware)
4. Communiquer aux clients via status page et email

### Post-mortem (sous 5 jours)
1. Document blameless dans Notion `/incidents/YYYYMMDD-titre`
2. Timeline détaillée
3. Actions correctives et préventives
4. Présentation en réunion d'équipe

## Procédure compromise d'accès

Si un secret ou identifiant est compromis :
1. Révoquer immédiatement via le panneau de gestion
2. Rotation forcée tous les tokens actifs (`./scripts/rotate_jwt_keys.sh`)
3. Forcer logout de tous les utilisateurs concernés
4. Audit des logs sur les 30 derniers jours
5. Notification CDP/CNIL sous 72h si données personnelles

## Conformité

- Loi 2017-410 Côte d'Ivoire (données personnelles)
- Loi 2008-12 Sénégal (CDP)
- Loi UEMOA sur le commerce électronique
- DPA signés avec sous-traitants (OpenAI, Stripe, Cloudflare, AWS)
- DPO désigné, registre des traitements maintenu

## Tests de sécurité

- Bandit + Safety dans la CI (chaque PR)
- Trivy sur images Docker (chaque build)
- npm audit + Dependabot (web et mobile)
- Pentest externe annuel par cabinet spécialisé
- Bug bounty privé prévu en année 2

## Contacts

- Security team : security@printhub.io (clé PGP disponible)
- DPO : dpo@printhub.io
- Astreinte : +225 XX XX XX XX XX
- Status page : status.printhub.io
