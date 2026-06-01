/// Variables d'environnement de l'application.
///
/// En production, ces valeurs proviennent de `--dart-define=KEY=value`.
class Env {
  Env._();

  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );

  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'ws://10.0.2.2:8001',
  );

  static const String defaultLocale = String.fromEnvironment(
    'DEFAULT_LOCALE',
    defaultValue: 'fr',
  );

  static const String defaultCurrency = String.fromEnvironment(
    'DEFAULT_CURRENCY',
    defaultValue: 'XOF',
  );

  static const String defaultCountry = String.fromEnvironment(
    'DEFAULT_COUNTRY',
    defaultValue: 'CI',
  );

  static const String sentryDsn = String.fromEnvironment('SENTRY_DSN');
  static const bool isProduction = bool.fromEnvironment('dart.vm.product');
}
