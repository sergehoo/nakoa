import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/api/dashboards_api.dart';
import '../../../data/api/orders_api.dart';
import '../../../data/models/order.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/app_scaffold.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/status_chip.dart';
import '../../auth/providers/auth_provider.dart';

final _customerDashboardProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(dashboardsApiProvider).customer();
});

final _recentOrdersProvider = FutureProvider<List<Order>>((ref) async {
  return ref.read(ordersApiProvider).list();
});

class CustomerDashboardScreen extends ConsumerWidget {
  const CustomerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final user = ref.watch(authProvider).value?.user;
    final dashboard = ref.watch(_customerDashboardProvider);
    final orders = ref.watch(_recentOrdersProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_customerDashboardProvider);
          ref.invalidate(_recentOrdersProvider);
        },
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              expandedHeight: 96,
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                title: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Bonjour 👋', style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor)),
                    Text(user?.fullName ?? 'Utilisateur',
                        style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () => context.push('/notifications'),
                ),
              ],
            ),
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  dashboard.when(
                    loading: () => const SizedBox(height: 120, child: Center(child: CircularProgressIndicator())),
                    error: (e, _) => Text('Erreur : $e'),
                    data: (d) => GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.6,
                      children: [
                        _KpiCard(
                          label: 'Commandes',
                          value: (d['total_orders'] ?? 0).toString(),
                          icon: Icons.shopping_bag_outlined,
                          color: theme.colorScheme.primary,
                        ),
                        _KpiCard(
                          label: 'En cours',
                          value: (d['in_progress'] ?? 0).toString(),
                          icon: Icons.local_shipping_outlined,
                          color: Colors.orange.shade700,
                        ),
                        _KpiCard(
                          label: 'Livrées',
                          value: (d['delivered'] ?? 0).toString(),
                          icon: Icons.task_alt_outlined,
                          color: Colors.green.shade700,
                        ),
                        _KpiCard(
                          label: 'Dépensé',
                          value: formatCurrency(double.tryParse(d['lifetime_spend']?.toString() ?? '0') ?? 0),
                          icon: Icons.account_balance_wallet_outlined,
                          color: theme.colorScheme.secondary,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Dernières commandes',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                      TextButton(onPressed: () => context.push('/orders'), child: const Text('Voir tout')),
                    ],
                  ),
                  const SizedBox(height: 8),
                  orders.when(
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Text('Erreur : $e'),
                    data: (list) => list.isEmpty
                        ? EmptyState(
                            icon: Icons.shopping_bag_outlined,
                            title: 'Aucune commande pour le moment',
                            message: 'Découvrez le catalogue pour passer votre première commande.',
                            action: FilledButton.icon(
                              icon: const Icon(Icons.search),
                              label: const Text('Explorer le catalogue'),
                              onPressed: () => context.push('/catalog'),
                            ),
                          )
                        : Column(
                            children: list
                                .take(5)
                                .map((o) => Card(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      child: ListTile(
                                        leading: CircleAvatar(
                                          backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
                                          child: Icon(Icons.inventory_2_outlined,
                                              color: theme.colorScheme.primary),
                                        ),
                                        title: Text(o.reference, style: const TextStyle(fontWeight: FontWeight.w600)),
                                        subtitle: Text(
                                          '${o.productName ?? '—'} • ${formatDate(o.createdAt)}',
                                          style: const TextStyle(fontSize: 12),
                                        ),
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
                                    ))
                                .toList(),
                          ),
                  ),
                  const SizedBox(height: 80),
                ]),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/catalog'),
        icon: const Icon(Icons.add),
        label: const Text('Commander'),
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({required this.label, required this.value, required this.icon, required this.color});
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, size: 18, color: color),
            ),
            const Spacer(),
            Text(value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            Text(label, style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor)),
          ],
        ),
      ),
    );
  }
}
