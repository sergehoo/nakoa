import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/order.dart';
import 'api_client.dart';

final ordersApiProvider = Provider<OrdersApi>((ref) => OrdersApi(ref.read(apiClientProvider)));

class OrdersApi {
  OrdersApi(this._client);
  final ApiClient _client;

  Future<List<Order>> list({String? status}) async {
    final data = await _client.get<Map<String, dynamic>>('/orders/', query: {
      if (status != null) 'status': status,
    });
    return (data['results'] as List<dynamic>)
        .map((o) => Order.fromJson(o as Map<String, dynamic>))
        .toList();
  }

  Future<Order> detail(String id) async {
    final data = await _client.get<Map<String, dynamic>>('/orders/$id/');
    return Order.fromJson(data);
  }

  Future<void> transition(String id, String action) => _client.post<void>('/orders/$id/$action/');
}
