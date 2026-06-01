import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/user.dart';
import 'api_client.dart';

final authApiProvider = Provider<AuthApi>((ref) => AuthApi(ref.read(apiClientProvider)));

class AuthApi {
  AuthApi(this._client);
  final ApiClient _client;

  Future<({String access, String refresh, AppUser user})> login({
    required String email,
    required String password,
    String? twoFactorCode,
  }) async {
    final data = await _client.post<Map<String, dynamic>>('/auth/login/', body: {
      'email': email,
      'password': password,
      if (twoFactorCode != null && twoFactorCode.isNotEmpty) 'two_factor_code': twoFactorCode,
    });
    return (
      access: data['access'] as String,
      refresh: data['refresh'] as String,
      user: AppUser.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  Future<AppUser> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    String country = 'CI',
    String role = 'customer',
  }) async {
    final data = await _client.post<Map<String, dynamic>>('/auth/register/', body: {
      'email': email,
      'password': password,
      'first_name': firstName,
      'last_name': lastName,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      'country': country,
      'primary_role': role,
    });
    return AppUser.fromJson(data);
  }

  Future<void> requestOtp({required String identifier, required String purpose, String channel = 'sms'}) =>
      _client.post<void>('/auth/otp/request/', body: {
        'identifier': identifier,
        'purpose': purpose,
        'channel': channel,
      });

  Future<void> verifyOtp({required String identifier, required String code, required String purpose}) =>
      _client.post<void>('/auth/otp/verify/', body: {
        'identifier': identifier,
        'code': code,
        'purpose': purpose,
      });

  Future<({String secret, String provisioningUri, List<String> backupCodes})> setupTotp() async {
    final data = await _client.post<Map<String, dynamic>>('/auth/2fa/setup/');
    return (
      secret: data['secret'] as String,
      provisioningUri: data['provisioning_uri'] as String,
      backupCodes: (data['backup_codes'] as List<dynamic>).cast<String>(),
    );
  }

  Future<void> confirmTotp(String code) =>
      _client.post<void>('/auth/2fa/confirm/', body: {'code': code});

  Future<AppUser> me() async {
    final data = await _client.get<Map<String, dynamic>>('/accounts/me/');
    return AppUser.fromJson(data);
  }

  Future<void> logout(String refresh) =>
      _client.post<void>('/auth/logout/', body: {'refresh': refresh});
}
