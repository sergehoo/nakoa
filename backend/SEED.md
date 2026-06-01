# PrintHub Backend — Migrations & Seed Data

Documentation du workflow de migrations Django et de chargement du dataset de démonstration.

## 1. Workflow complet (premier démarrage)

```bash
# 1. Démarrer les services
make up

# 2. Générer les migrations (ordre topologique automatique)
docker compose exec api ./scripts/make_migrations.sh

# 3. Appliquer les migrations
make migrate

# 4. Charger les données de démo
make seed
# ou : docker compose exec api python manage.py seed_demo

# 5. Créer un superuser supplémentaire si besoin
make createsuperuser
```

## 2. Ordre topologique des apps

L'ordre suivant est respecté par `scripts/make_migrations.sh` parce que certains modèles dépendent d'autres via des ForeignKey :

1. **core** — modèles abstraits (TimeStampedModel, BaseModel)
2. **accounts** — `AUTH_USER_MODEL` requis par toutes les autres apps
3. **authentication** — dépend de accounts
4. **organizations** — dépend de accounts
5. **customers** — dépend de accounts
6. **printers** — dépend de accounts
7. **catalog** — indépendant
8. **pricing** — dépend de printers + catalog
9. **quote_requests** — dépend de accounts + catalog
10. **matching** — dépend de quote_requests
11. **documents** — utilisé par BAT (orders), KYC, payments
12. **storage** — indépendant
13. **orders** — dépend de catalog + printers + customers + quote_requests + documents
14. **production** — dépend de orders + printers + accounts
15. **logistics** — dépend de orders
16. **delivery** — dépend de logistics + accounts
17. **payments** — dépend de orders + accounts + printers
18. **subscriptions** — dépend de accounts (puis FK depuis printers ajoutée)
19. **billing** — dépend de orders + accounts + printers
20. **reviews** — dépend de orders + accounts + printers
21. **notifications** — dépend de accounts
22. **chat** — dépend de accounts + orders + quote_requests
23. **analytics** — dépend de accounts
24. **ai_engine** — dépend de orders + documents
25. **ai_assistant** — dépend de accounts
26. **audit** — dépend de accounts
27. **kyc** — dépend de accounts
28. **support** — dépend de accounts + orders
29. **crm** — dépend de accounts
30. **workflows** — indépendant
31. **dashboards** — pas de modèle (endpoints agrégés)

## 3. Dataset chargé par `seed_demo`

### Plans d'abonnement (4)
- **Basic** — gratuit — 15 % commission
- **Pro** — 15 000 XOF/mois — 12 %
- **Premium** — 50 000 XOF/mois — 10 %
- **Enterprise** — 250 000 XOF/mois — 8 %

### Utilisateurs (~22 comptes, tous au domaine `@demo.printhub.io`)
Mot de passe par défaut : **`Printhub2026!`**

| Email | Rôle |
|-------|------|
| `admin@demo.printhub.io` | Super Admin |
| `admin1@demo.printhub.io` à `admin2@` | Admin plateforme |
| `support1@demo.printhub.io` à `support2@` | Support |
| `aissata@demo.printhub.io` | Client particulier (Aïssata Diallo) |
| `client1@demo.printhub.io` à `client4@` | Clients particuliers |
| `brand-o@demo.printhub.io` | Client entreprise (Agence Brand'O) |
| `ong-uemoa@demo.printhub.io` | Client entreprise (ONG) |
| `cocody-print@demo.printhub.io` | Imprimeur Cocody Print |
| `treichville-print@demo.printhub.io` | Imprimeur Atelier Treichville |
| `dakar-print@demo.printhub.io` | Imprimeur Dakar Print Express |
| `agent1@demo.printhub.io` à `agent3@` | Agents imprimeurs |
| `livreur1@demo.printhub.io` à `livreur3@` | Livreurs |

### Catalogue (10 catégories, ~50 produits)
- **Cartes de visite** — 5 produits (standard 350g → dorure à chaud)
- **Flyers** — 5 produits (A6, A5, A4, DL plié, carte postale) avec options Papier + Grammage
- **Affiches** — 5 produits (A3 → A0)
- **Brochures** — 5 produits (8p, 12p, 16p, 24p)
- **Bâches** — 5 produits (2×1m → 4×2m + micro-perforée + tissée)
- **Stickers** — 5 produits (ronds, carrés, planches, transparents, vinyle)
- **Tampons** — 5 produits (rond, rectangulaire, dateur, poche, logo)
- **Magazines** — 5 produits (24p → cousu dos carré)
- **Packaging** — 5 produits (boîte carton, pochette kraft, étiquettes…)
- **Signalétique** — 5 produits (roll-up, kakémono, panneau PVC, vitrophanie, akilux)

### Imprimeurs (3 complets)

| Slug | Ville | Score | Délais | Charge |
|------|-------|-------|--------|--------|
| `cocody-print` | Abidjan, CI | 96 | 94 % | 48 % |
| `treichville-print` | Abidjan, CI | 88 | 91 % | 65 % |
| `dakar-print` | Dakar, SN | 82 | 88 % | 35 % |

Chaque imprimeur dispose de :
- 3 machines (HP Indigo digital, Heidelberg offset, Roland grand format)
- 3 finitions (vernis, pelliculage, dorure)
- 1 zone de livraison locale
- Capabilities sur toutes les catégories
- 3 grilles tarifaires pour les flyers principaux (3 paliers chacune)

### Commandes (9 commandes de démo)

Une commande dans chaque statut majeur du FSM, créée pour Aïssata Diallo chez Cocody Print sur le produit "Flyer A6 recto-verso 135g" :

- `draft`, `quoted`, `payment_pending`, `paid`, `in_production`, `quality_check`, `in_delivery`, `delivered`, `completed`

Cela permet de tester immédiatement tous les écrans et transitions de statut.

## 4. Options de la commande

```bash
# Seed complet
python manage.py seed_demo

# Reset complet puis seed (utile en dev)
python manage.py seed_demo --reset

# Seed un seul module
python manage.py seed_demo --only=catalog
python manage.py seed_demo --only=printers
python manage.py seed_demo --only=plans
python manage.py seed_demo --only=users
python manage.py seed_demo --only=pricing
python manage.py seed_demo --only=orders
```

La commande est **idempotente** : elle peut être ré-exécutée sans dupliquer les données (`update_or_create` partout).

## 5. Factories factory_boy

Les factories sont disponibles dans chaque app sous `apps/<app>/factories.py`. Elles sont utilisées par `seed_demo` mais aussi par les tests :

```python
from apps.accounts.factories import CustomerFactory, PrinterOwnerFactory
from apps.catalog.factories import CategoryFactory, ProductFactory
from apps.printers.factories import PrinterProfileFactory
from apps.orders.factories import OrderFactory

# Dans un test
def test_order_creation():
    customer = CustomerFactory()
    printer = PrinterProfileFactory()
    order = OrderFactory(customer=customer, printer=printer)
    assert order.reference.startswith("PH-")
```

## 6. Reset complet base + seed (dev)

```bash
# Vider la base et recommencer de zéro
make flush
make migrate
make seed
```

Ou en une commande :

```bash
docker compose exec api python manage.py flush --no-input \
  && docker compose exec api python manage.py migrate \
  && docker compose exec api python manage.py seed_demo
```

## 7. Troubleshooting

### `makemigrations` échoue avec une erreur d'imports
- Vérifier que toutes les apps sont déclarées dans `config/settings/base.py` (LOCAL_APPS).
- Vérifier que les FK utilisent bien des **string references** (`"catalog.Product"`) plutôt que des imports directs pour éviter les cycles.

### `seed_demo` échoue sur `IntegrityError`
- Lancer avec `--reset` pour repartir d'une base propre.
- Vérifier que la commande tourne dans une transaction (c'est le cas par défaut).

### Les imprimeurs n'ont pas de `geo_point`
- PostGIS doit être activé. Vérifier que l'image `postgis/postgis:16-3.4-alpine` est bien utilisée (voir `docker-compose.yml`).
- Vérifier que `django.contrib.gis` est dans `INSTALLED_APPS` et que `DATABASES.default.ENGINE` pointe vers `django.contrib.gis.db.backends.postgis`.

### Le `User` custom n'est pas pris en compte
- Vérifier `AUTH_USER_MODEL = "accounts.User"` dans `config/settings/base.py`.
- Si la base existe déjà avec le User Django par défaut, il faut tout repartir à zéro (`flush` + `migrate`).

## 8. Production

**Important** : `seed_demo` ne doit jamais être exécutée en production. Les comptes `@demo.printhub.io` doivent être réservés au dev et au staging.

En staging :
```bash
docker compose -f docker-compose.staging.yml exec api python manage.py seed_demo --reset
```

En production : aucune commande de seed automatique. Les premiers comptes admins sont créés manuellement via `createsuperuser`, puis les imprimeurs et catégories sont créés via l'admin Django ou l'API.
