/// Constantes globales de l'application.
class AppConstants {
  AppConstants._();

  static const String appName = 'Nakoa';
  static const Duration httpTimeout = Duration(seconds: 30);
  static const Duration httpReceiveTimeout = Duration(seconds: 30);

  static const String accessTokenKey = 'printhub.access_token';
  static const String refreshTokenKey = 'printhub.refresh_token';
  static const String userKey = 'printhub.user';
  static const String themeKey = 'printhub.theme';
  static const String localeKey = 'printhub.locale';

  static const int otpLength = 6;
  static const Duration otpResendCooldown = Duration(seconds: 30);
}
