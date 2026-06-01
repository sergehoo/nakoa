import 'package:flutter/material.dart';

import '../../data/models/order.dart';

class OrderStatusChip extends StatelessWidget {
  const OrderStatusChip(this.status, {super.key});
  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    final (color, fg) = switch (status) {
      OrderStatus.draft => (Colors.grey.shade200, Colors.grey.shade700),
      OrderStatus.quotePending => (Colors.amber.shade100, Colors.amber.shade800),
      OrderStatus.quoted => (Colors.blue.shade100, Colors.blue.shade800),
      OrderStatus.batUploaded => (Colors.grey.shade200, Colors.grey.shade700),
      OrderStatus.batValidated => (Colors.blue.shade100, Colors.blue.shade800),
      OrderStatus.paymentPending => (Colors.amber.shade100, Colors.amber.shade800),
      OrderStatus.paid => (Colors.green.shade100, Colors.green.shade800),
      OrderStatus.assigned => (Colors.blue.shade100, Colors.blue.shade800),
      OrderStatus.accepted => (Colors.blue.shade100, Colors.blue.shade800),
      OrderStatus.inProduction => (Colors.indigo.shade100, Colors.indigo.shade800),
      OrderStatus.qualityCheck => (Colors.amber.shade100, Colors.amber.shade800),
      OrderStatus.readyForPickup => (Colors.teal.shade100, Colors.teal.shade800),
      OrderStatus.inDelivery => (Colors.purple.shade100, Colors.purple.shade800),
      OrderStatus.delivered => (Colors.green.shade100, Colors.green.shade800),
      OrderStatus.completed => (Colors.green.shade100, Colors.green.shade800),
      OrderStatus.cancelled => (Colors.red.shade100, Colors.red.shade800),
      OrderStatus.disputed => (Colors.red.shade100, Colors.red.shade800),
      OrderStatus.refunded => (Colors.grey.shade200, Colors.grey.shade700),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
      child: Text(status.label, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}
