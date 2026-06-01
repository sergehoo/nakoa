import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/api/orders_api.dart';
import '../../../data/models/order.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/app_scaffold.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';

final _ordersProvider = FutureProvider<List<Order>>((ref) => ref.read(ordersApiProvider).list());

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(_ordersProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Mes commandes')),
      body: orders.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (list) => list.isEmpty
            ? const EmptyState(icon: Icons.shopping_bag_outlined, title: 'Aucune commande')
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_ordersProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final o = list[i];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                          child: Icon(Icons.inventory_2_outlined,
                              color: Theme.of(context).colorScheme.primary),
                        ),
                        title: Text(o.reference, style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text('${o.productName ?? '—'} • ${o.quantity} pièces'),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            OrderStatusChip(o.status),
                            const SizedBox(height: 4),
                            Text(formatCurrency(o.totalInclTax, o.currency),
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                          ],
                        ),
                        onTap: () => context.push('/orders/${o.id}'),
                      ),
                    );
                  },
                ),
              ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 2),
    );
  }
}
