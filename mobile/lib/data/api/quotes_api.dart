import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/quote.dart';
import 'api_client.dart';

final quotesApiProvider = Provider<QuotesApi>((ref) => QuotesApi(ref.read(apiClientProvider)));

class QuotesApi {
  QuotesApi(this._client);
  final ApiClient _client;

  Future<List<QuoteRequest>> list() async {
    final data = await _client.get<Map<String, dynamic>>('/quote-requests/');
    return (data['results'] as List<dynamic>)
        .map((q) => QuoteRequest.fromJson(q as Map<String, dynamic>))
        .toList();
  }

  Future<QuoteRequest> detail(String id) async {
    final data = await _client.get<Map<String, dynamic>>('/quote-requests/$id/');
    return QuoteRequest.fromJson(data);
  }

  Future<QuoteRequest> create({
    required String productId,
    required int quantity,
    List<String> optionValueIds = const [],
    String country = 'CI',
  }) async {
    final data = await _client.post<Map<String, dynamic>>('/quote-requests/', body: {
      'product': productId,
      'quantity': quantity,
      'option_values': optionValueIds,
      'delivery_country': country,
    });
    return QuoteRequest.fromJson(data);
  }

  Future<void> submit(String id) => _client.post<void>('/quote-requests/$id/submit/');

  Future<Map<String, dynamic>> selectOffer({required String quoteId, required String offerId}) =>
      _client.post<Map<String, dynamic>>(
        '/quote-requests/$quoteId/select-offer/',
        body: {'offer_id': offerId},
      );

  Future<Map<String, dynamic>> convert(String quoteId) =>
      _client.post<Map<String, dynamic>>('/quote-requests/$quoteId/convert/');
}
