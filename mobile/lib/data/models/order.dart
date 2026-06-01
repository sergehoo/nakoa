enum OrderStatus {
  draft,
  quotePending,
  quoted,
  batUploaded,
  batValidated,
  paymentPending,
  paid,
  assigned,
  accepted,
  inProduction,
  qualityCheck,
  readyForPickup,
  inDelivery,
  delivered,
  completed,
  cancelled,
  disputed,
  refunded;

  String get label {
    switch (this) {
      case OrderStatus.draft:
        return 'Brouillon';
      case OrderStatus.quotePending:
        return 'Devis en attente';
      case OrderStatus.quoted:
        return 'Devis disponible';
      case OrderStatus.batUploaded:
        return 'BAT déposé';
      case OrderStatus.batValidated:
        return 'BAT validé';
      case OrderStatus.paymentPending:
        return 'Paiement en attente';
      case OrderStatus.paid:
        return 'Payée';
      case OrderStatus.assigned:
        return 'Attribuée';
      case OrderStatus.accepted:
        return 'Acceptée';
      case OrderStatus.inProduction:
        return 'En production';
      case OrderStatus.qualityCheck:
        return 'Contrôle qualité';
      case OrderStatus.readyForPickup:
        return 'Prête';
      case OrderStatus.inDelivery:
        return 'En livraison';
      case OrderStatus.delivered:
        return 'Livrée';
      case OrderStatus.completed:
        return 'Clôturée';
      case OrderStatus.cancelled:
        return 'Annulée';
      case OrderStatus.disputed:
        return 'En litige';
      case OrderStatus.refunded:
        return 'Remboursée';
    }
  }

  static OrderStatus from(String raw) {
    switch (raw) {
      case 'quote_pending':
        return OrderStatus.quotePending;
      case 'quoted':
        return OrderStatus.quoted;
      case 'bat_uploaded':
        return OrderStatus.batUploaded;
      case 'bat_validated':
        return OrderStatus.batValidated;
      case 'payment_pending':
        return OrderStatus.paymentPending;
      case 'paid':
        return OrderStatus.paid;
      case 'assigned':
        return OrderStatus.assigned;
      case 'accepted':
        return OrderStatus.accepted;
      case 'in_production':
        return OrderStatus.inProduction;
      case 'quality_check':
        return OrderStatus.qualityCheck;
      case 'ready_for_pickup':
        return OrderStatus.readyForPickup;
      case 'in_delivery':
        return OrderStatus.inDelivery;
      case 'delivered':
        return OrderStatus.delivered;
      case 'completed':
        return OrderStatus.completed;
      case 'cancelled':
        return OrderStatus.cancelled;
      case 'disputed':
        return OrderStatus.disputed;
      case 'refunded':
        return OrderStatus.refunded;
      default:
        return OrderStatus.draft;
    }
  }
}

class Order {
  Order({
    required this.id,
    required this.reference,
    required this.quantity,
    required this.totalInclTax,
    required this.currency,
    required this.status,
    required this.createdAt,
    this.productName,
    this.printerName,
    this.expectedDeliveryAt,
    this.deliveredAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'] as String,
        reference: json['reference'] as String,
        quantity: (json['quantity'] as num).toInt(),
        totalInclTax: double.tryParse(json['total_incl_tax']?.toString() ?? '0') ?? 0,
        currency: json['currency'] as String? ?? 'XOF',
        status: OrderStatus.from(json['status'] as String),
        productName: json['product_name'] as String? ??
            (json['product_detail'] is Map ? (json['product_detail'] as Map)['name'] as String? : null),
        printerName: json['printer_name'] as String? ??
            (json['printer_detail'] is Map ? (json['printer_detail'] as Map)['trade_name'] as String? : null),
        expectedDeliveryAt:
            json['expected_delivery_at'] != null ? DateTime.tryParse(json['expected_delivery_at'] as String) : null,
        deliveredAt: json['delivered_at'] != null ? DateTime.tryParse(json['delivered_at'] as String) : null,
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  final String id;
  final String reference;
  final int quantity;
  final double totalInclTax;
  final String currency;
  final OrderStatus status;
  final String? productName;
  final String? printerName;
  final DateTime? expectedDeliveryAt;
  final DateTime? deliveredAt;
  final DateTime createdAt;
}
