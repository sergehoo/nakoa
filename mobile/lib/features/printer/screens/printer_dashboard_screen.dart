import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/api/dashboards_api.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/app_scaffold.dart';

final _printerDashboardProvider =
    FutureProvider<Map<String, dynamic>>((ref) => ref.read(dashboardsApiProvider).printer());

class PrinterDashboardScreen extends ConsumerWidget {
  const PrinterDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final data = ref.watch(_printerDashboardProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Tableau de bord')),
      body: data.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (d) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(_printerDashboardProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.6,
                children: [
                  _Stat('CA 30j', formatCurrency(double.tryParse(d['ca_30d']?.toString() ?? '0') ?? 0), Icons.account_balance_wallet_outlined, theme.colorScheme.primary),
                  _Stat('Commandes', '${d['orders_30d'] ?? 0}', Icons.shopping_bag_outlined, theme.colorScheme.secondary),
                  _Stat('En production', '${d['in_production'] ?? 0}', Icons.precision_manufacturing_outlined, Colors.orange),
                  _Stat('À accepter', '${d['to_accept'] ?? 0}', Icons.pending_actions_outlined, Colors.amber),
                ],
              ),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Performance atelier', style: TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 12),
                      _PerfRow('Score qualité', double.tryParse(d['quality_score']?.toString() ?? '0') ?? 0),
                      const SizedBox(height: 12),
                      _PerfRow('Respect des délais', double.tryParse(d['on_time_rate']?.toString() ?? '0') ?? 0),
                      const SizedBox(height: 12),
                      _PerfRow('Charge actuelle', double.tryParse(d['current_load_pct']?.toString() ?? '0') ?? 0),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Solde wallet', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      Text(
                        formatCurrency(double.tryParse(d['wallet_balance']?.toString() ?? '0') ?? 0),
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.arrow_downward, size: 16),
                        label: const Text('Demander un retrait'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0, role: 'printer'),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.label, this.value, this.icon, this.color);
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, size: 16, color: color),
            ),
            const Spacer(),
            Text(value, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            Text(label, style: TextStyle(fontSize: 11, color: Theme.of(context).hintColor)),
          ],
        ),
      ),
    );
  }
}

class _PerfRow extends StatelessWidget {
  const _PerfRow(this.label, this.value);
  final String label;
  final double value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12)),
            Text('${value.toStringAsFixed(0)}%', style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(value: (value / 100).clamp(0, 1)),
      ],
    );
  }
}
