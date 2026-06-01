/// Exceptions métier PrintHub.
sealed class AppException implements Exception {
  const AppException(this.message, {this.code, this.statusCode});
  final String message;
  final String? code;
  final int? statusCode;

  @override
  String toString() => 'AppException($message)';
}

class NetworkException extends AppException {
  const NetworkException(super.message);
}

class UnauthorizedException extends AppException {
  const UnauthorizedException([super.message = 'Session expirée']) : super(statusCode: 401);
}

class ForbiddenException extends AppException {
  const ForbiddenException([super.message = 'Accès interdit']) : super(statusCode: 403);
}

class NotFoundException extends AppException {
  const NotFoundException([super.message = 'Introuvable']) : super(statusCode: 404);
}

class ValidationException extends AppException {
  const ValidationException(super.message, {this.fields});
  final Map<String, List<String>>? fields;
}

class BusinessException extends AppException {
  const BusinessException(super.message, {super.code});
}

class TwoFactorRequiredException extends AppException {
  const TwoFactorRequiredException() : super('Code 2FA requis');
}
