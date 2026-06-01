import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/widgets/app_scaffold.dart';

class AtelierDashboardScreen extends ConsumerWidget {
  const AtelierDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Atelier')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.qr_code_scanner, color: theme.colorScheme.primary),
              ),
              title: const Text('Scanner un job', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('Démarrez ou finalisez une étape de production'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/atelier/scan'),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: theme.colorScheme.secondary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.assignment_outlined, color: theme.colorScheme.secondary),
              ),
              title: const Text('Jobs du jour', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('Consultez vos tâches assignées'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.report_problem_outlined, color: Colors.amber),
              ),
              title: const Text('Signaler un incident', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('Papier, machine, BAT, électricité…'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {},
            ),
          ),
        ],
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 0, role: 'printer'),
    );
  }
}
