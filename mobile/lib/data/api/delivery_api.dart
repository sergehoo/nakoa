import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

final deliveryApiProvider =
    Provider<DeliveryApi>((ref) => DeliveryApi(ref.read(apiClientProvider)));

class DeliveryApi {
  DeliveryApi(this._client);
  final ApiClient _client;

  Future<List<Map<String, dynamic>>> assignments() async {
    final data = await _client.get<Map<String, dynamic>>('/delivery/assignments/');
    return (data['results'] as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<void> reportLocation({
    required String assignmentId,
    required double lat,
    required double lng,
    double? speedKmh,
    double? accuracy,
  }) =>
      _client.post<void>('/delivery/assignments/$assignmentId/report-location/', body: {
        'lat': lat,
        'lng': lng,
        if (speedKmh != null) 'speed_kmh': speedKmh,
        if (accuracy != null) 'accuracy_m': accuracy,
        'recorded_at': DateTime.now().toUtc().toIso8601String(),
      });
}
