# PrintHub — Templates Business, Juridique & Acquisition

Document de référence pour les étapes **non-techniques** de la roadmap (Phases 5, 7, 8, 9).
Ces étapes nécessitent une exécution humaine mais sont structurées ici pour faciliter le démarrage.

---

## Étape 5.1 — Société et immatriculation Côte d'Ivoire

### Checklist
- [ ] Réserver le nom commercial **PrintHub SARL** au CEPICI
- [ ] Rédiger les statuts (capital minimum 1 000 000 XOF)
- [ ] Enregistrement RCCM au tribunal d'Abidjan (~2 semaines, 100 000-200 000 XOF)
- [ ] DFE (Déclaration Fiscale d'Existence) à la DGI
- [ ] Numéro de Compte Contribuable (NCC)
- [ ] Carte d'opérateur économique
- [ ] Affiliation CNPS (employés)
- [ ] Compte bancaire entreprise (Société Générale CI, NSIA, Ecobank)
- [ ] Domiciliation siège (Cocody, Plateau ou Marcory)

### Coûts estimés
- Frais juridiques : 600 000 – 1 200 000 XOF
- Capital social libéré : 1 000 000 XOF minimum
- Frais bancaires : 50 000 – 150 000 XOF

### Documents à préparer
- Pièce d'identité dirigeant
- Justificatif domicile
- Casier judiciaire < 3 mois
- Procuration éventuelle

---

## Étape 5.2 — Documents légaux (à faire rédiger par un avocat)

### Conditions Générales d'Utilisation
- Acceptation à l'inscription (checkbox obligatoire)
- Description du service marketplace + ERP
- Comptes utilisateurs : création, suspension, suppression
- Propriété intellectuelle (BAT restent propriété client)
- Limitations de responsabilité
- Droit applicable : loi ivoirienne
- Juridiction : tribunal d'Abidjan

### Conditions Générales de Vente
- Catalogue et prix
- Commande et acceptation
- Paiement : Mobile Money, carte, virement
- Délais de livraison (indicatifs)
- Droit de rétractation (B2C : 14 jours, sauf produits personnalisés)
- Garantie PrintHub Care (48h)
- Litiges et médiation

### Politique de confidentialité (loi 2017-410 CI)
- Finalités du traitement
- Données collectées (catégories)
- Base légale (consentement, exécution contrat)
- Durée de conservation (10 ans commandes, 5 ans KYC)
- Destinataires (sous-traitants listés)
- Droits utilisateurs : accès, rectification, suppression, opposition
- Contact DPO : dpo@printhub.io
- Réclamation auprès de l'ARTCI

### DPA sous-traitants
- OpenAI (DPA standard signé en ligne)
- Anthropic
- Stripe
- CinetPay
- Cloudflare
- AWS (ou OVH, Scaleway)
- Sentry

---

## Étape 5.4 — Contrats partenaires paiement

### CinetPay
- Compte marchand business
- KYB complet (RCCM, NCC, statuts)
- Commission : 1,5 % CB + 2,5 % Mobile Money
- Délai paiement : J+1 ouvré
- Webhook signé HMAC

### Wave Business
- Compte business Wave (CI / SN)
- Validation 1 semaine
- Commission : 1 % (la plus basse du marché)
- API key + webhook secret
- Settlement quotidien

### Orange Money Merchant
- Demande via Orange Cameroun / Orange CI Business
- KYB renforcé
- Commission : 1,5 %
- Settlement J+2

### MTN MoMo
- Compte développeur sur https://momodeveloper.mtn.com
- Souscription Collection API
- Subscription key + API user + API key
- Commission : 1,5 %

### Compte séquestre (escrow)
- Partenariat avec un EME agréé BCEAO (ex : Wave, NSIA, Orabank)
- Convention de séquestre
- Reporting hebdomadaire des fonds en transit
- Reconciliation comptable mensuelle

---

## Étape 7.1 — Plan de recrutement année 1

### Fiches de poste prioritaires

#### 1. CTO / Tech Lead (mois 1)
- 8+ ans expérience SaaS
- Maîtrise Django, PostgreSQL, Docker, AWS/cloud
- Leadership technique, recrutement, architecture
- Salaire : 1 500 000 – 2 500 000 XOF/mois selon expérience
- Equity : 1-3 %

#### 2. Backend Senior Django × 2 (mois 1-2)
- 5+ ans Python, 3+ ans Django/DRF
- Expérience PostgreSQL avancé, Celery, Redis
- Tests, CI/CD, observabilité
- Salaire : 800 000 – 1 200 000 XOF/mois

#### 3. Frontend Senior React/Next (mois 2)
- 4+ ans React, 2+ ans TypeScript
- Expérience Next.js App Router, Tailwind, design system
- Salaire : 700 000 – 1 000 000 XOF/mois

#### 4. Mobile Flutter (mois 3)
- 3+ ans Flutter, expérience apps publiées
- Maîtrise Riverpod, GoRouter, FCM
- Salaire : 700 000 – 900 000 XOF/mois

#### 5. Data / IA Engineer (mois 3)
- 3+ ans Python ML, LightGBM, scikit-learn
- Expérience OpenAI/Anthropic API, prompt engineering
- Bonus : computer vision (analyse BAT)
- Salaire : 800 000 – 1 100 000 XOF/mois

#### 6. DevOps / SRE (mois 2)
- Docker, Kubernetes, Terraform, AWS/OVH
- Monitoring (Prometheus, Grafana, Sentry)
- Sécurité, sauvegardes
- Salaire : 800 000 – 1 200 000 XOF/mois

#### 7. UI/UX Designer (mois 2)
- 3+ ans design produit SaaS
- Maîtrise Figma, design systems
- Salaire : 600 000 – 900 000 XOF/mois

#### 8. Product Manager (mois 4)
- 4+ ans PM SaaS B2B ou B2C
- Maîtrise méthodologie produit, métriques
- Salaire : 800 000 – 1 200 000 XOF/mois

#### 9. Customer Success Manager (mois 4)
- 3+ ans CSM ou commercial B2B
- Connaissance secteur imprimerie ou marketplace
- Bilingue FR/EN
- Salaire : 600 000 – 900 000 XOF/mois

### Canaux de recrutement
- LinkedIn Recruiter (CI, SN, BJ, France, Maroc)
- AfricaTech jobs, Talent2Africa
- Communautés Slack (DevAfrica, AfricaTech)
- Partenariats écoles (ESATIC, ISI, EPITA Sénégal)
- Cooptation interne (prime 500 000 XOF par embauche réussie)

---

## Étape 8.1 — Onboarding imprimeurs pilotes

### Liste cibles Abidjan (50 imprimeurs)

#### Cocody / 2 Plateaux
- 8 ateliers identifiés (à vérifier auprès du Syndicat des Imprimeurs)

#### Plateau / Treichville
- 12 imprimeries historiques

#### Marcory / Zone 4
- 10 imprimeries grand format / sérigraphie

#### Yopougon / Abobo
- 15 imprimeries quartier populaire

#### Riviera / Angré
- 5 ateliers haut de gamme

### Processus de signature

1. **Premier contact** (téléphone ou visite)
   - Présenter PrintHub en 5 minutes
   - Démo live de la plateforme (tablette)
   - Document one-pager imprimé

2. **Rendez-vous démo** (1 heure)
   - Visite atelier
   - Compréhension besoins
   - Calcul ROI personnalisé (commission vs gains nouveaux clients)

3. **Signature**
   - Contrat type PrintHub (4 pages)
   - Premier mois gratuit
   - Engagement 0 (sans engagement)

4. **Onboarding technique** (2 heures)
   - Création compte
   - Soumission KYB
   - Formation à l'admin imprimeur (web ou tablette)
   - Configuration catalogue + prix (5-10 produits clés)
   - Première commande de test

5. **Suivi 60 jours**
   - Hebdo : appel CSM, 15 min
   - Métriques : commandes reçues, score, retours clients
   - Adaptation prix / catalogue selon retours marché

---

## Étape 8.5 — Budget acquisition année 1

### Mois 1-3 : Préparation (5 M XOF)
- Création contenus (vidéos, photos, articles SEO) : 2 M
- Site marketing finalisé : 1 M
- Stand FESPA Africa : 2 M

### Mois 4-6 : Soft launch (15 M XOF)
- Google Ads (search "imprimerie Abidjan") : 5 M
- Meta Ads (Facebook + Instagram targeting) : 6 M
- Partenariats 3 agences de communication : 2 M
- Influenceurs (5 micro-influenceurs business CI) : 2 M

### Mois 7-12 : Croissance (40 M XOF)
- Google + Meta scale : 20 M
- LinkedIn Ads (cible grands comptes) : 5 M
- WhatsApp Business broadcast : 2 M
- Programme parrainage clients (5 000 XOF / parrainage validé) : 5 M
- Partenariats événementiels (3 salons) : 5 M
- PR (relations presse + Forbes Africa, Jeune Afrique) : 3 M

**Total acquisition année 1 : 60 M XOF (~92 k€)**

---

## Étape 9 — Roadmap expansion détaillée

### Phase 2 — CI intérieur (mois 13-15)
- Bouaké (capitale économique nord)
- Yamoussoukro (capitale politique)
- San Pedro (port + cacao)
- 50 imprimeurs supplémentaires
- 1 CSM mobile

### Phase 3 — Sénégal Dakar (mois 16-18)
- Partenariat avec une fintech locale (Wave SN, InTouch)
- Bureau commercial Dakar (1 Country Manager + 2 CSM)
- 80 imprimeurs à signer
- Adaptation TVA sénégalaise (18 %)
- Notification CDP Sénégal

### Phase 4 — Bénin Cotonou (mois 19-21)
- Partenariat MTN MoMo BJ
- 50 imprimeurs
- 1 CSM local

### Phase 5 — Burkina, Togo, Mali, Niger (mois 22-24)
- Mode "agent local" pour zones moins denses
- Partenariats EME UEMOA mutualisés
- 100 imprimeurs au total

### Phase 6 — CEMAC (année 3+)
- Cameroun (Douala + Yaoundé)
- Gabon (Libreville)
- Cycle complet de réplication

---

## Suivi des étapes business

| Étape | Description | Owner | Statut |
|-------|-------------|-------|--------|
| 5.1 | Immatriculation SARL | Founder + Avocat | `[ ]` |
| 5.2 | Documents légaux | Avocat | `[ ]` |
| 5.3 | Conformité données | DPO + Avocat | `[ ]` |
| 5.4 | Contrats partenaires paiement | Founder | `[ ]` |
| 5.5 | Assurances | Founder + Courtier | `[ ]` |
| 7.1 | Recrutement 10 ETP | CTO + Founder | `[ ]` |
| 8.1 | 30 imprimeurs pilotes | CSM Manager | `[ ]` |
| 8.5 | Campagnes acquisition | PM + Marketing | `[ ]` |
| 9.1-9.3 | Expansion régionale | COO | `[ ]` |

---

**Document à compléter au fil du temps** — chaque entrée doit être réalisée en parallèle du développement technique.
