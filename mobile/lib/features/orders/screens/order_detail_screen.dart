import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/api/orders_api.dart';
import '../../../data/models/order.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/status_chip.dart';

final _orderProvider = FutureProvider.family.autoDispose<Order, String>((ref, id) async {
  return ref.read(ordersApiProvider).detail(id);
});

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({super.key, required this.id});
  final String id;

  static const _steps = [
    (OrderStatus.paid, 'Payée'),
    (OrderStatus.accepted, 'Acceptée'),
    (OrderStatus.inProduction, 'Production'),
    (OrderStatus.qualityCheck, 'Contrôle'),
    (OrderStatus.inDelivery, 'Livraison'),
    (OrderStatus.delivered, 'Livrée'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final order = ref.watch(_orderProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Détail commande')),
      body: order.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (o) {
          final currentIdx = _steps.indexWhere((s) => s.$1 == o.status);
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(_orderProvider(id)),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(o.reference,
                              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                          Text(o.productName ?? '—',
                              style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor)),
                        ],
                      ),
                    ),
                    OrderStatusChip(o.status),
                  ],
                ),
                const SizedBox(height: 20),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Suivi de production',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                        const SizedBox(height: 16),
                        Row(
                          children: List.generate(_steps.length, (i) {
                            final done = currentIdx >= i;
                            final active = currentIdx == i;
                            return Expanded(
                              child: Column(
                                children: [
                                  AnimatedContainer(
                                    duration: const Duration(milliseconds: 250),
                                    width: 28,
                                    height: 28,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: done ? theme.colorScheme.primary : theme.dividerColor,
                                    ),
                                    child: done
                                        ? const Icon(Icons.check, size: 16, color: Colors.white)
                                        : null,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(_steps[i].$2,
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                                        color: done ? theme.colorScheme.primary : theme.hintColor,
                                      )),
                                ],
                              ),
                            );
                          }),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _Row(label: 'Quantité', value: ''),
                        _Row(label: 'Quantité', value: '${o.quantity} pièces'),
                        const Divider(),
                        _Row(label: 'Imprimeur', value: o.printerName ?? 'En attribution'),
                        const Divider(),
                        _Row(
                          label: 'Livraison prévue',
                          value: o.expectedDeliveryAt != null
                              ? formatDateTime(o.expectedDeliveryAt!)
                              : '—',
                        ),
                        const Divider(),
                        _Row(label: 'Total TTC', value: formatCurrency(o.totalInclTax, o.currency)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Theme.of(context).hintColor, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}
