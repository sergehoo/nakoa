import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/notification.dart';
import 'api_client.dart';

final notificationsApiProvider =
    Provider<NotificationsApi>((ref) => NotificationsApi(ref.read(apiClientProvider)));

class NotificationsApi {
  NotificationsApi(this._client);
  final ApiClient _client;

  Future<List<AppNotification>> list() async {
    final data = await _client.get<Map<String, dynamic>>('/notifications/');
    return (data['results'] as List<dynamic>)
        .map((n) => AppNotification.fromJson(n as Map<String, dynamic>))
        .toList();
  }

  Future<int> unreadCount() async {
    final data = await _client.get<Map<String, dynamic>>('/notifications/unread-count/');
    return (data['unread'] as num).toInt();
  }

  Future<void> markRead(String id) => _client.post<void>('/notifications/$id/mark-read/');
  Future<void> readAll() => _client.post<void>('/notifications/read-all/');
}
