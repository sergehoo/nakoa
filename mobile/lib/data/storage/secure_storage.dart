import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/constants.dart';

class SecureStorage {
  SecureStorage()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
          iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
        );

  final FlutterSecureStorage _storage;

  Future<void> saveTokens({required String access, required String refresh}) async {
    await _storage.write(key: AppConstants.accessTokenKey, value: access);
    await _storage.write(key: AppConstants.refreshTokenKey, value: refresh);
  }

  Future<String?> readAccessToken() => _storage.read(key: AppConstants.accessTokenKey);
  Future<String?> readRefreshToken() => _storage.read(key: AppConstants.refreshTokenKey);

  Future<void> clear() async {
    await _storage.delete(key: AppConstants.accessTokenKey);
    await _storage.delete(key: AppConstants.refreshTokenKey);
    await _storage.delete(key: AppConstants.userKey);
  }

  Future<void> saveUser(String json) => _storage.write(key: AppConstants.userKey, value: json);
  Future<String?> readUser() => _storage.read(key: AppConstants.userKey);
}
