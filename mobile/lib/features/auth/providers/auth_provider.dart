import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/api/auth_api.dart';
import '../../../data/models/user.dart';
import '../../../data/api/api_client.dart';
import '../../../data/storage/secure_storage.dart';

class AuthState {
  AuthState({this.user, this.isAuthenticated = false});
  final AppUser? user;
  final bool isAuthenticated;

  AuthState copyWith({AppUser? user, bool? isAuthenticated}) =>
      AuthState(user: user ?? this.user, isAuthenticated: isAuthenticated ?? this.isAuthenticated);
}

class AuthNotifier extends AsyncNotifier<AuthState> implements Listenable {
  final List<VoidCallback> _listeners = [];

  @override
  void addListener(VoidCallback l) => _listeners.add(l);

  @override
  void removeListener(VoidCallback l) => _listeners.remove(l);

  void _notify() {
    for (final l in _listeners) {
      l();
    }
  }

  @override
  Future<AuthState> build() async {
    final storage = ref.read(secureStorageProvider);
    final token = await storage.readAccessToken();
    if (token == null) return AuthState();
    try {
      final user = await ref.read(authApiProvider).me();
      await storage.saveUser(jsonEncode(user.toJson()));
      _notify();
      return AuthState(user: user, isAuthenticated: true);
    } catch (_) {
      // Fallback : restaurer depuis le cache local
      final raw = await storage.readUser();
      if (raw != null) {
        final user = AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
        return AuthState(user: user, isAuthenticated: true);
      }
      return AuthState();
    }
  }

  Future<void> login({required String email, required String password, String? twoFactorCode}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final storage = ref.read(secureStorageProvider);
      final r = await ref.read(authApiProvider).login(
            email: email,
            password: password,
            twoFactorCode: twoFactorCode,
          );
      await storage.saveTokens(access: r.access, refresh: r.refresh);
      await storage.saveUser(jsonEncode(r.user.toJson()));
      return AuthState(user: r.user, isAuthenticated: true);
    });
    _notify();
  }

  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    String country = 'CI',
    String role = 'customer',
  }) async {
    await ref.read(authApiProvider).register(
          email: email,
          password: password,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          country: country,
          role: role,
        );
  }

  Future<void> logout() async {
    final storage = ref.read(secureStorageProvider);
    final refresh = await storage.readRefreshToken();
    if (refresh != null) {
      try {
        await ref.read(authApiProvider).logout(refresh);
      } catch (_) {}
    }
    await storage.clear();
    state = AsyncData(AuthState());
    _notify();
  }

  Future<void> refresh() async {
    state = await AsyncValue.guard(build);
    _notify();
  }
}

final authProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
