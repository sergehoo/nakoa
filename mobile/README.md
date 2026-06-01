# PrintHub — Mobile (Flutter)

Application mobile multi-rôles de la plateforme PrintHub.

## Stack

- **Flutter 3.24+** / **Dart 3.5+**
- **Riverpod 2** — gestion d'état réactive
- **Dio 5** — client HTTP avec intercepteur JWT + refresh transparent
- **GoRouter 14** — routing déclaratif + redirection selon rôle
- **Firebase Cloud Messaging** — notifications push
- **Hive** + **flutter_secure_storage** — cache offline + tokens chiffrés
- **flutter_map** + **geolocator** — cartographie OpenStreetMap + GPS
- **mobile_scanner** — lecture QR codes atelier
- **signature** — signature manuscrite preuve de livraison
- **image_picker** — capture photo BAT / preuve
- **pinput** — saisie OTP / 2FA
- **fl_chart** — graphiques
- **google_fonts** — Inter / Sora

## Structure

```
mobile/
├── pubspec.yaml
├── analysis_options.yaml             # very_good_analysis (strict)
├── .env.example
└── lib/
    ├── main.dart                     # init Hive + ProviderScope
    ├── app/                          # config app
    │   ├── app.dart                  # MaterialApp + ThemeMode.system
    │   ├── theme.dart                # Light + Dark, Material 3
    │   ├── router.dart               # GoRouter + redirection rôle
    │   └── env.dart                  # API_URL, WS_URL, defaults
    ├── core/
    │   ├── constants.dart
    │   ├── errors.dart               # AppException hiérarchie
    │   └── push_service.dart         # FCM + notifications locales
    ├── data/
    │   ├── api/                      # api_client, auth, catalog, orders, quotes, delivery, dashboards, notifications
    │   ├── models/                   # AppUser, Product, Order (FSM 18 statuts), QuoteRequest, ...
    │   └── storage/                  # SecureStorage (tokens chiffrés)
    ├── features/                     # 9 modules métier
    │   ├── auth/                     # splash, login, register, OTP (pinput), 2FA TOTP
    │   ├── dashboard/                # KPIs client
    │   ├── catalog/                  # liste + filtres + détail produit + configurateur
    │   ├── quotes/                   # devis + comparateur offres IA
    │   ├── orders/                   # liste + détail avec timeline 6 étapes
    │   ├── delivery/                 # tournée GPS + carte + preuve (photo + signature)
    │   ├── atelier/                  # dashboard + scan QR jobs
    │   ├── notifications/            # liste + marquer lu
    │   └── settings/                 # profil + sécurité + déconnexion
    ├── shared/                       # widgets transversaux
    │   ├── widgets/                  # AppButton, AppTextField, EmptyState, OrderStatusChip, AppBottomNav
    │   └── utils/                    # formatters (XOF, dates)
    └── l10n/                         # FR / EN
```

## Démarrage rapide

```bash
# 1. Récupérer les dépendances
flutter pub get

# 2. Émulateur Android — pointer vers le backend local
flutter run --dart-define=API_URL=http://10.0.2.2:8000 --dart-define=WS_URL=ws://10.0.2.2:8001

# 3. Simulateur iOS
flutter run --dart-define=API_URL=http://localhost:8000

# 4. Build production
flutter build apk --release --dart-define=API_URL=https://api.printhub.io
flutter build ipa --release --dart-define=API_URL=https://api.printhub.io
```

## Multi-rôles

L'app détecte le `primary_role` retourné par l'API à la connexion et redirige automatiquement :

| Rôle | Route initiale | Navigation |
|------|----------------|-----------|
| `customer` / `customer_corporate` | `/dashboard` | Bottom nav : Accueil, Catalogue, Commandes, Compte |
| `courier` | `/courier` | Bottom nav : Tournée, Alertes, Compte |
| `printer` / `printer_agent` / `quality_controller` | `/atelier` | Bottom nav : Atelier, Scanner, Alertes, Compte |
| `admin` | `/dashboard` (web recommandé) | — |

## Parcours principaux

### Client
1. **Splash** → vérifie le JWT en cache (auto-login si valide).
2. **Inscription** : email + mot de passe + pays + rôle (cartes visuelles).
3. **OTP** : code à 6 chiffres avec auto-resend cooldown 30 s.
4. **Dashboard** : 4 KPIs + 5 dernières commandes.
5. **Catalogue** : grille filtrable par catégorie + recherche temps réel.
6. **Configurateur produit** : quantité + options (format, papier, finition) → demande de devis.
7. **Comparateur** : offres avec badges (Recommandée IA, Meilleur prix, Plus rapide) → conversion en commande.
8. **Suivi commande** : timeline 6 étapes (Payée → Acceptée → Production → Contrôle → Livraison → Livrée) avec refresh.

### Livreur
1. **Tournée** : liste des courses assignées.
2. **Course** : carte OpenStreetMap + tracking GPS continu envoyé au backend toutes les 20 m (`report-location`).
3. **Preuve** : photo du colis + signature manuscrite + nom du réceptionnaire.

### Agent atelier
1. **Dashboard** : 3 actions (scanner, jobs du jour, signaler incident).
2. **Scanner QR** : lecture caméra → bottom sheet pour démarrer / terminer / signaler.

## Authentification

- JWT (access + refresh) stockés via **flutter_secure_storage** (Keychain iOS, EncryptedSharedPreferences Android).
- Intercepteur Dio qui :
  - Ajoute automatiquement le `Authorization: Bearer <access>` à chaque requête authentifiée.
  - Refresh transparent sur 401 (mutex pour éviter les refresh concurrents).
  - Clear automatique sur refresh échoué.
- Support **2FA TOTP** (Google Authenticator, Authy) avec écran dédié + 10 codes de secours.
- Support **OTP** SMS / email / WhatsApp selon le `purpose`.

## Spécificités Afrique de l'Ouest

- Devise par défaut : **XOF** (Franc CFA, formatage sans décimales).
- Pays défaut : **CI** (Côte d'Ivoire), sélecteur UEMOA+CEMAC.
- Locale par défaut : **fr** (FR + EN supportés via `AppLocalizations`).
- Émulateur Android : `API_URL=http://10.0.2.2:8000` (Genymotion : `10.0.3.2`).
- Cartographie : **OpenStreetMap** (gratuit, couverture africaine excellente).

## Notifications push

Le `PushService` (`lib/core/push_service.dart`) initialise FCM + notifications locales :
- Demande permission au premier lancement.
- Récupère le token FCM (à envoyer à l'API via `POST /accounts/devices/`).
- Affiche les notifications foreground via `flutter_local_notifications`.
- Background handler `@pragma('vm:entry-point')` conforme aux exigences Android 13+.

Le `google-services.json` (Android) et `GoogleService-Info.plist` (iOS) doivent être ajoutés par le développeur — ils sont ignorés par git.

## Mode offline

- **Hive** est initialisé dès le `main()` et la box `printhub.cache` est ouverte pour permettre la mise en cache des commandes en cours, du catalogue récent et des notifications.
- Le profil utilisateur est mis en cache dans le secure storage : si la requête `/accounts/me/` échoue (mode avion), l'app restaure l'état d'auth depuis le cache.

## Statistiques

- **49 fichiers Dart**
- **~4 213 lignes** de code
- **22 écrans** répartis sur 9 modules métier
- **7 clients API** typés alignés sur le backend Django
- **6 widgets partagés** réutilisables
- **Dark mode** + **Light mode** + **i18n FR/EN** dès le départ

## Tests

```bash
flutter test
flutter analyze
dart format --set-exit-if-changed lib test
```

## Roadmap technique

- [ ] Génération des modèles via `freezed` + `json_serializable` (déjà ajoutés en dev_deps).
- [ ] Cache offline complet via Hive (queue de mutations à synchroniser à la reconnexion).
- [ ] Tests d'intégration `patrol` sur les parcours critiques (commande, livraison).
- [ ] Crash reporting Sentry / Firebase Crashlytics.
- [ ] Localisations supplémentaires (wolof, baoulé, bambara).
- [ ] Mode tablette atelier (vue dense pour opérateurs).
