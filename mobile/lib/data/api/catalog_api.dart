import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/product.dart';
import 'api_client.dart';

final catalogApiProvider = Provider<CatalogApi>((ref) => CatalogApi(ref.read(apiClientProvider)));

class CatalogApi {
  CatalogApi(this._client);
  final ApiClient _client;

  Future<List<Category>> categories() async {
    final data = await _client.get<Map<String, dynamic>>('/catalog/categories/');
    return (data['results'] as List<dynamic>)
        .map((c) => Category.fromJson(c as Map<String, dynamic>))
        .toList();
  }

  Future<List<Product>> products({String? category, String? search}) async {
    final data = await _client.get<Map<String, dynamic>>('/catalog/products/', query: {
      if (category != null) 'category': category,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return (data['results'] as List<dynamic>)
        .map((p) => Product.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  Future<Product> product(String slug) async {
    final data = await _client.get<Map<String, dynamic>>('/catalog/products/$slug/');
    return Product.fromJson(data);
  }
}
