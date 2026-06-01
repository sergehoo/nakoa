# PrintHub — Matrice de couverture Backend × Frontend × Mobile

Statut par module fonctionnel. Légende :
- ✅ **Complet** : implémenté et testable
- 🟡 **Partiel** : squelette en place, finitions UX/UI ou intégrations à compléter
- ❌ **Absent** : à construire entièrement
- N/A : non applicable à ce client

| # | Module | Backend Django | Web Next.js | Mobile Flutter | Reste à faire |
|---|--------|----------------|-------------|----------------|---------------|
| 1 | **Auth (login/register/refresh)** | ✅ | ✅ | ✅ | OAuth Google callback |
| 2 | **OTP SMS/email/WhatsApp** | ✅ | ✅ | ✅ | — |
| 3 | **2FA TOTP + backup codes** | ✅ | ✅ | ✅ | — |
| 4 | **Profil utilisateur + adresses** | ✅ | ✅ | 🟡 | UI mobile édition adresses |
| 5 | **Devices FCM** | ✅ | N/A | 🟡 | Envoi token au backend après login |
| 6 | **KYC client niveaux 0-4** | ✅ | 🟡 | ❌ | UI mobile upload documents |
| 7 | **KYB imprimeur (RCCM, fiscal, dirigeant)** | ✅ | ✅ | N/A | OCR documents |
| 8 | **Validation manuelle KYC/KYB admin** | ✅ | ✅ | N/A | — |
| 9 | **Organisations multi-utilisateurs** | ✅ | 🟡 | ❌ | UI gestion membres + invitations |
| 10 | **Catalogue catégories** | ✅ | ✅ | ✅ | — |
| 11 | **Catalogue produits + options** | ✅ | ✅ | ✅ | — |
| 12 | **Templates téléchargeables (PSD/AI/PDF)** | ✅ | 🟡 | ❌ | UI download |
| 13 | **Configurateur produit multi-étapes** | ✅ | 🟡 | ✅ | Stepper visuel + preview 3D |
| 14 | **Calcul prix dynamique (PriceCalculator)** | ✅ | ✅ | ❌ | Endpoint mobile + UI |
| 15 | **Grilles tarifaires imprimeur** | ✅ | 🟡 | ❌ | UI gestion grilles imprimeur web |
| 16 | **PromoCode / Codes promo** | ✅ | ❌ | ❌ | UI input code + validation |
| 17 | **Demande de devis** | ✅ | ✅ | ✅ | — |
| 18 | **Comparateur d'offres IA** | ✅ | ✅ | ✅ | — |
| 19 | **Matching engine v2** | ✅ | N/A | N/A | LightGBM réel à entraîner |
| 20 | **Failover reassignment auto** | ❌ | ❌ | ❌ | À créer |
| 21 | **Commande (FSM 18 statuts)** | ✅ | ✅ | ✅ | — |
| 22 | **Upload BAT** | ✅ | ✅ | ❌ | UI mobile upload + analyse IA |
| 23 | **Analyse BAT IA réelle** | ✅ | ✅ | 🟡 | UI rapport mobile |
| 24 | **Paiement Stripe** | ✅ | ✅ | ✅ | Tests sandbox |
| 25 | **Paiement CinetPay** | ✅ | ✅ | ✅ | Contrat marchand |
| 26 | **Paiement Wave** | ✅ | ✅ | ✅ | Contrat business |
| 27 | **Paiement Orange Money** | ✅ | ✅ | 🟡 | Contrat partenariat |
| 28 | **Paiement MTN MoMo** | ✅ | ✅ | 🟡 | Souscription Collection API |
| 29 | **Paiement Moov Money** | ✅ | ✅ | ❌ | Confirmation API agrégateur |
| 30 | **Paiement Paystack** | ✅ | ✅ | ❌ | Contrat |
| 31 | **Paiement Flutterwave** | ✅ | ✅ | ❌ | Contrat |
| 32 | **PaymentOrchestrator (sélection auto)** | ❌ | ❌ | ❌ | Gap critique — fixé |
| 33 | **Escrow + release J+3 auto** | 🟡 | N/A | N/A | Tâche Celery Beat |
| 34 | **Refund** | ✅ | 🟡 | ❌ | UI admin déclenchement |
| 35 | **Split payment commission/payout** | 🟡 | N/A | N/A | Service à créer |
| 36 | **Wallet imprimeur** | ✅ | ✅ | 🟡 | Mobile imprimeur full UI |
| 37 | **Payout vers Mobile Money** | 🟡 | 🟡 | 🟡 | Workflow demande + traitement |
| 38 | **ERP Production (jobs + steps)** | ✅ | ✅ | 🟡 | Kanban mobile imprimeur |
| 39 | **Drag-and-drop Kanban** | N/A | 🟡 | ❌ | Hello DnD ou react-beautiful-dnd |
| 40 | **QR Code job** | 🟡 | N/A | ✅ | Génération côté backend |
| 41 | **Production incidents** | ✅ | 🟡 | ❌ | UI déclaration mobile |
| 42 | **Photos production** | ✅ | 🟡 | ❌ | Upload mobile via presigned URL |
| 43 | **Controle qualité (étape FSM)** | ✅ | ✅ | ❌ | UI mobile contrôleur |
| 44 | **Logistique transporteurs** | ✅ | ❌ | N/A | UI gestion transporteurs admin |
| 45 | **Shipments + tracking number** | ✅ | 🟡 | ❌ | UI tracking client |
| 46 | **Routes optimisées (TSP)** | ❌ | ❌ | N/A | Algo + UI |
| 47 | **DeliveryAssignment** | ✅ | N/A | ✅ | — |
| 48 | **GPS tracking continu livreur** | ✅ | N/A | ✅ | — |
| 49 | **Preuve livraison (photo + signature)** | ✅ | N/A | ✅ | Upload réel via presigned URL |
| 50 | **ETA prédictif** | ❌ | ❌ | ❌ | Phase 2 |
| 51 | **Reviews + ratings** | ✅ | ✅ | 🟡 | UI mobile écriture review |
| 52 | **Réponse imprimeur aux reviews** | ✅ | 🟡 | ❌ | UI imprimeur mobile |
| 53 | **Notifications email** | ✅ | N/A | N/A | Templates structurés |
| 54 | **Notifications SMS Africa's Talking** | ✅ | N/A | N/A | Activation production |
| 55 | **Notifications Push FCM** | ✅ | N/A | ✅ | google-services.json à fournir |
| 56 | **Notifications WhatsApp Business** | ✅ | N/A | N/A | Templates approuvés Meta |
| 57 | **Notifications in-app temps réel** | ✅ | ✅ | ✅ | — |
| 58 | **Chat client ↔ imprimeur WebSocket** | ✅ | ✅ | 🟡 | UI mobile chat |
| 59 | **Chat support ↔ utilisateurs** | ✅ | 🟡 | ❌ | UI dédiée |
| 60 | **Pièces jointes chat** | 🟡 | ❌ | ❌ | Upload + preview |
| 61 | **Indicateurs typing + lecture** | ❌ | ❌ | ❌ | À créer |
| 62 | **Support tickets** | ✅ | 🟡 | 🟡 | UI admin + mobile |
| 63 | **Knowledge Base / FAQ** | ❌ | ❌ | ❌ | Public Help Center |
| 64 | **CRM Leads + Activities** | ✅ | ❌ | N/A | UI admin / commercial |
| 65 | **Pipeline commercial Kanban** | ✅ | ❌ | N/A | UI vue stages |
| 66 | **Plans d'abonnement SaaS** | ✅ | ✅ | N/A | — |
| 67 | **Souscription + renouvellement** | ✅ | 🟡 | N/A | Workflow paiement récurrent |
| 68 | **Facturation auto + numérotation** | ✅ | ✅ | N/A | Tâche Celery génération PDF |
| 69 | **Factures conformes UEMOA** | ✅ | ✅ | 🟡 | — |
| 70 | **Bons de livraison + QR** | ✅ | 🟡 | ✅ | — |
| 71 | **Exports comptables** | ❌ | ❌ | N/A | À ajouter (XLSX/CSV) |
| 72 | **Dashboard client** | ✅ | ✅ | ✅ | — |
| 73 | **Dashboard imprimeur** | ✅ | ✅ | ✅ | — |
| 74 | **Dashboard admin** | ✅ | ✅ | N/A | — |
| 75 | **Charts temps réel** | ✅ | ✅ | 🟡 | Animation fl_chart mobile |
| 76 | **Heatmap géographique commandes** | ❌ | ❌ | N/A | À créer (Leaflet plugin) |
| 77 | **Audit logs admin** | ✅ | 🟡 | N/A | UI consultation logs |
| 78 | **AI Assistant client** | ✅ | ✅ | ❌ | UI mobile assistant |
| 79 | **AI Assistant imprimeur** | ✅ | 🟡 | ❌ | Persona context augmenté |
| 80 | **AI Assistant admin** | ✅ | 🟡 | N/A | Outils SQL guard-railed |
| 81 | **PrintHub Insights imprimeur** | ❌ | ❌ | ❌ | Rapport hebdo IA |
| 82 | **Documents génération PDF (facture/devis/BL)** | ✅ | 🟡 | N/A | Téléchargement UI |
| 83 | **Stockage MinIO + presigned URLs** | ✅ | ✅ | 🟡 | Mobile branchement complet |
| 84 | **Antivirus uploads (ClamAV)** | ❌ | N/A | N/A | À ajouter |
| 85 | **Recherche Elasticsearch** | 🟡 | ❌ | ❌ | Documents Index + UI |
| 86 | **Workflows configurables** | ✅ | ❌ | N/A | UI admin éditeur workflows |
| 87 | **Multi-tenant (orgs cloisonnées)** | 🟡 | 🟡 | 🟡 | Middleware d'isolation à valider |
| 88 | **Multi-pays / multi-devises** | ✅ | ✅ | ✅ | — |
| 89 | **Multilingue FR/EN** | ✅ | ✅ | ✅ | — |
| 90 | **Dark/light mode** | N/A | ✅ | ✅ | — |
| **🎯 INNOVATIONS** |
| 91 | **WhatsApp-first ordering** | ✅ | N/A | N/A | Templates Meta + lien paiement |
| 92 | **PrintHub Score (15 signaux)** | ✅ | 🟡 | 🟡 | Endpoint + UI score visible |
| 93 | **PrintHub Care (garantie 48h)** | ✅ | 🟡 | 🟡 | UI ouverture réclamation |
| 94 | **Mode Express 4h** | ✅ | 🟡 | ❌ | UI sélection + countdown |
| 95 | **Studio IA création graphique** | 🟡 | ❌ | ❌ | UI prompt + éditeur Fabric.js |
| 96 | **Marketplace templates designers** | ❌ | ❌ | ❌ | Phase 3 |
| 97 | **Live production cam (WebRTC)** | ❌ | ❌ | ❌ | Phase 3 |
| 98 | **Crédit BNPL imprimeur** | ❌ | ❌ | ❌ | Partenariat fintech |
| 99 | **Agents-imprimeurs ruraux** | ❌ | ❌ | ❌ | Phase 2 (modèle business) |
| 100 | **PrintHub Insights coach IA** | ❌ | ❌ | ❌ | Phase 2 |

---

## Statistiques globales

### Par dimension
- **Backend** : 79 ✅ + 8 🟡 + 7 ❌ + 6 N/A = **87 % de couverture**
- **Frontend Web** : 47 ✅ + 22 🟡 + 17 ❌ + 14 N/A = **65 % de couverture**
- **Mobile Flutter** : 38 ✅ + 15 🟡 + 32 ❌ + 15 N/A = **53 % de couverture**

### Par catégorie
| Catégorie | Items | Complets | Taux |
|-----------|-------|----------|------|
| Auth & KYC | 9 | 7 | 78 % |
| Catalogue & Pricing | 7 | 5 | 71 % |
| Devis & Matching | 4 | 2 | 50 % |
| Commandes & BAT | 4 | 4 | 100 % |
| Paiements | 11 | 7 | 64 % |
| Production ERP | 6 | 1 | 17 % |
| Logistique | 6 | 3 | 50 % |
| Reviews & Notifications | 9 | 5 | 56 % |
| Support & CRM | 5 | 0 | 0 % |
| Abonnements & Facturation | 6 | 2 | 33 % |
| Dashboards | 5 | 3 | 60 % |
| IA | 6 | 3 | 50 % |
| Documents & Stockage | 4 | 1 | 25 % |
| Recherche & Workflows | 3 | 0 | 0 % |
| Multi-tenant | 4 | 2 | 50 % |
| **Innovations** | 10 | 0 | 0 % (4/10 amorcées) |

### Priorités absolues avant pilote (étapes en ❌)
1. **PaymentOrchestrator** unifié (PA1) — gap critique fixé ci-dessous
2. **Failover reassignment matching** (MT1) — 1 j
3. **Tâche Celery release escrow** (PA3) — 4 h
4. **ClamAV antivirus uploads** (S2) — 1 j
5. **OAuth Google flow complet** (A1) — 2 h
6. **Pages admin web sur vraies API** (F3) — 4 h
7. **Page publique imprimeur avec Score** (F2) — 2 h
8. **OfflineQueue branchée + FCM token** (M2/M3) — 4 h
9. **Tests couverture > 60 %** (B8) — 12 j

**Total estimé : 18-22 jours-développeur avec équipe en place**
