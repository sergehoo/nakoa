import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/api/delivery_api.dart';
import '../../../shared/widgets/app_scaffold.dart';
import '../../../shared/widgets/empty_state.dart';

final _assignmentsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) => ref.read(deliveryApiProvider).assignments());

class CourierDashboardScreen extends ConsumerWidget {
  const CourierDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final assignments = ref.watch(_assignmentsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tournée du jour'),
        actions: [
          IconButton(
            onPressed: () => context.push('/notifications'),
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: assignments.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (list) => list.isEmpty
            ? const EmptyState(
                icon: Icons.local_shipping_outlined,
                title: 'Pas de course assignée',
                message: 'Activez les notifications pour recevoir vos prochaines courses.',
              )
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_assignmentsProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) {
                    final a = list[i];
                    final status = a['status'] as String? ?? 'assigned';
                    return Card(
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () => context.push('/delivery/${a['id']}'),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: theme.colorScheme.primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(Icons.local_shipping, color: theme.colorScheme.primary),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Course #${i + 1}',
                                            style: const TextStyle(fontWeight: FontWeight.w700)),
                                        Text(status, style: TextStyle(fontSize: 12, color: theme.hintColor)),
                                      ],
                                    ),
                                  ),
                                  const Icon(Icons.chevron_right),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0, role: 'courier'),
    );
  }
}
