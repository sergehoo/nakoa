class QuoteOffer {
  QuoteOffer({
    required this.id,
    required this.printerName,
    required this.printerCity,
    required this.totalInclTax,
    required this.currency,
    required this.leadTimeDays,
    required this.tag,
    required this.isAiRecommended,
    required this.qualityScore,
  });

  factory QuoteOffer.fromJson(Map<String, dynamic> json) => QuoteOffer(
        id: json['id'] as String,
        printerName: (json['printer'] as Map)['trade_name'] as String,
        printerCity: (json['printer'] as Map)['city'] as String? ?? '',
        totalInclTax: double.tryParse(json['total_incl_tax']?.toString() ?? '0') ?? 0,
        currency: json['currency'] as String? ?? 'XOF',
        leadTimeDays: (json['estimated_lead_time_days'] as num?)?.toInt() ?? 0,
        tag: json['tag'] as String? ?? 'standard',
        isAiRecommended: json['is_ai_recommended'] as bool? ?? false,
        qualityScore: double.tryParse(json['quality_score_snapshot']?.toString() ?? '0') ?? 0,
      );

  final String id;
  final String printerName;
  final String printerCity;
  final double totalInclTax;
  final String currency;
  final int leadTimeDays;
  final String tag;
  final bool isAiRecommended;
  final double qualityScore;

  String get tagLabel {
    switch (tag) {
      case 'recommended':
        return 'Recommandée IA';
      case 'best_price':
        return 'Meilleur prix';
      case 'fastest':
        return 'Plus rapide';
      case 'premium':
        return 'Premium';
      case 'nearest':
        return 'Le plus proche';
      default:
        return 'Standard';
    }
  }
}

class QuoteRequest {
  QuoteRequest({
    required this.id,
    required this.reference,
    required this.quantity,
    required this.status,
    required this.createdAt,
    this.productName,
    this.offers = const [],
  });

  factory QuoteRequest.fromJson(Map<String, dynamic> json) => QuoteRequest(
        id: json['id'] as String,
        reference: json['reference'] as String,
        quantity: (json['quantity'] as num).toInt(),
        status: json['status'] as String,
        productName:
            (json['product_detail'] is Map ? (json['product_detail'] as Map)['name'] as String? : null),
        offers: (json['offers'] as List<dynamic>? ?? [])
            .map((o) => QuoteOffer.fromJson(o as Map<String, dynamic>))
            .toList(),
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  final String id;
  final String reference;
  final int quantity;
  final String status;
  final String? productName;
  final List<QuoteOffer> offers;
  final DateTime createdAt;
}
