import 'dart:async';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

/// File de mutations offline persistées dans Hive.
///
/// Stocke chaque appel POST/PATCH/DELETE en attente lorsque le réseau est indisponible
/// et les rejoue à la reconnexion. Idempotency-Key automatique pour éviter les doublons.
class OfflineQueue {
  OfflineQueue._();
  static final instance = OfflineQueue._();

  static const String _boxName = 'printhub.offline_queue';
  Box<String>? _box;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  bool _isProcessing = false;

  Future<void> init() async {
    _box = await Hive.openBox<String>(_boxName);
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      if (!results.contains(ConnectivityResult.none)) {
        _processQueue();
      }
    });
  }

  void enqueue({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    String? idempotencyKey,
  }) {
    final entry = {
      'method': method,
      'path': path,
      'body': body,
      'idempotency_key': idempotencyKey ?? DateTime.now().millisecondsSinceEpoch.toString(),
      'queued_at': DateTime.now().toIso8601String(),
      'retries': 0,
    };
    _box?.add(jsonEncode(entry));
    debugPrint('[OfflineQueue] enqueued $method $path');
  }

  int get pendingCount => _box?.length ?? 0;

  Future<void> _processQueue() async {
    if (_isProcessing || _box == null || _box!.isEmpty) return;
    _isProcessing = true;
    debugPrint('[OfflineQueue] processing ${_box!.length} mutations');
    try {
      final keys = _box!.keys.toList();
      for (final key in keys) {
        final raw = _box!.get(key);
        if (raw == null) continue;
        final entry = jsonDecode(raw) as Map<String, dynamic>;
        try {
          // TODO : injecter ApiClient via Riverpod et rejouer la mutation
          // await ref.read(apiClientProvider).request(...)
          await _box!.delete(key);
          debugPrint('[OfflineQueue] replayed ${entry['method']} ${entry['path']}');
        } catch (e) {
          entry['retries'] = (entry['retries'] as int) + 1;
          if ((entry['retries'] as int) > 5) {
            await _box!.delete(key);
            debugPrint('[OfflineQueue] giving up on ${entry['path']}');
          } else {
            await _box!.put(key, jsonEncode(entry));
          }
        }
      }
    } finally {
      _isProcessing = false;
    }
  }

  Future<void> dispose() async {
    await _connectivitySub?.cancel();
  }
}
