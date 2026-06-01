import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';

import '../../app/env.dart';
import '../../core/constants.dart';
import '../../core/errors.dart';
import '../storage/secure_storage.dart';

final secureStorageProvider = Provider<SecureStorage>((ref) => SecureStorage());

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.read(secureStorageProvider);
  return ApiClient(storage);
});

class ApiClient {
  ApiClient(this._storage) : dio = _buildDio() {
    dio.interceptors.addAll([
      _AuthInterceptor(_storage, dio),
      if (!Env.isProduction)
        PrettyDioLogger(requestBody: true, responseBody: true, compact: true),
    ]);
  }

  static Dio _buildDio() => Dio(BaseOptions(
        baseUrl: '${Env.apiUrl}/api/v1',
        connectTimeout: AppConstants.httpTimeout,
        receiveTimeout: AppConstants.httpReceiveTimeout,
        headers: {'Accept': 'application/json'},
        contentType: 'application/json',
      ));

  final SecureStorage _storage;
  final Dio dio;

  Future<T> get<T>(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await dio.get<dynamic>(path, queryParameters: query);
      return res.data as T;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<T> post<T>(String path, {Object? body, Map<String, dynamic>? query}) async {
    try {
      final res = await dio.post<dynamic>(path, data: body, queryParameters: query);
      return res.data as T;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<T> patch<T>(String path, {Object? body}) async {
    try {
      final res = await dio.patch<dynamic>(path, data: body);
      return res.data as T;
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  Future<void> delete(String path) async {
    try {
      await dio.delete<dynamic>(path);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  AppException _mapError(DioException e) {
    final status = e.response?.statusCode ?? 0;
    final data = e.response?.data;
    final detail = data is Map ? (data['title'] ?? data['detail'])?.toString() : null;
    final message = detail ?? e.message ?? 'Erreur réseau';
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError) {
      return NetworkException(message);
    }
    return switch (status) {
      401 => const UnauthorizedException(),
      403 => const ForbiddenException(),
      404 => const NotFoundException(),
      422 => ValidationException(message),
      _ => BusinessException(message, code: data is Map ? data['code'] as String? : null),
    };
  }
}

class _AuthInterceptor extends Interceptor {
  _AuthInterceptor(this.storage, this.dio);

  final SecureStorage storage;
  final Dio dio;
  bool _refreshing = false;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (options.path.startsWith('/auth/login') || options.path.startsWith('/auth/register')) {
      return handler.next(options);
    }
    final token = await storage.readAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401 || _refreshing) {
      return handler.next(err);
    }
    final refresh = await storage.readRefreshToken();
    if (refresh == null) return handler.next(err);

    _refreshing = true;
    try {
      final r = await dio.post<dynamic>('/auth/token/refresh/', data: {'refresh': refresh});
      final newAccess = r.data['access'] as String;
      await storage.saveTokens(access: newAccess, refresh: refresh);
      final retry = err.requestOptions;
      retry.headers['Authorization'] = 'Bearer $newAccess';
      final res = await dio.fetch<dynamic>(retry);
      return handler.resolve(res);
    } catch (_) {
      await storage.clear();
      return handler.next(err);
    } finally {
      _refreshing = false;
    }
  }
}
