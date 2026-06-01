import 'package:flutter/material.dart';

/// i18n simplifié — pour la phase MVP, géré en mémoire.
/// Migrer vers `flutter_localizations` + `.arb` pour la version production.
class AppLocalizations {
  AppLocalizations(this.locale);
  final Locale locale;

  static AppLocalizations? of(BuildContext context) =>
      Localizations.of<AppLocalizations>(context, AppLocalizations);

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  static const Map<String, Map<String, String>> _values = {
    'fr': {
      'app.name': 'Nakoa',
      'auth.signIn': 'Se connecter',
      'auth.signUp': 'Créer un compte',
      'auth.email': 'Email',
      'auth.password': 'Mot de passe',
      'auth.phone': 'Téléphone',
      'auth.otpCode': 'Code reçu',
      'auth.forgotPassword': 'Mot de passe oublié ?',
      'auth.logout': 'Déconnexion',
      'nav.dashboard': 'Accueil',
      'nav.catalog': 'Catalogue',
      'nav.orders': 'Commandes',
      'nav.account': 'Compte',
      'nav.notifications': 'Notifications',
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.continue': 'Continuer',
      'common.back': 'Retour',
      'common.loading': 'Chargement…',
      'common.error': 'Une erreur est survenue',
      'common.retry': 'Réessayer',
    },
    'en': {
      'app.name': 'Nakoa',
      'auth.signIn': 'Sign in',
      'auth.signUp': 'Create account',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.phone': 'Phone',
      'auth.otpCode': 'OTP code',
      'auth.forgotPassword': 'Forgot password?',
      'auth.logout': 'Sign out',
      'nav.dashboard': 'Home',
      'nav.catalog': 'Catalog',
      'nav.orders': 'Orders',
      'nav.account': 'Account',
      'nav.notifications': 'Notifications',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.continue': 'Continue',
      'common.back': 'Back',
      'common.loading': 'Loading…',
      'common.error': 'Something went wrong',
      'common.retry': 'Retry',
    },
  };

  String t(String key) => _values[locale.languageCode]?[key] ?? _values['fr']![key] ?? key;
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();
  @override
  bool isSupported(Locale locale) => ['fr', 'en'].contains(locale.languageCode);
  @override
  Future<AppLocalizations> load(Locale locale) async => AppLocalizations(locale);
  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
