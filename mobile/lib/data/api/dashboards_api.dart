import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

final dashboardsApiProvider =
    Provider<DashboardsApi>((ref) => DashboardsApi(ref.read(apiClientProvider)));

class DashboardsApi {
  DashboardsApi(this._client);
  final ApiClient _client;

  Future<Map<String, dynamic>> customer() => _client.get('/dashboards/customer/');
  Future<Map<String, dynamic>> printer() => _client.get('/dashboards/printer/');
  Future<Map<String, dynamic>> admin() => _client.get('/dashboards/admin/');
}
