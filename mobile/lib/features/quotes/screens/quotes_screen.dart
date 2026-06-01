import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/api/quotes_api.dart';
import '../../../data/models/quote.dart';
import '../../../shared/utils/formatters.dart';
import '../../../shared/widgets/empty_state.dart';

final _quotesProvider = FutureProvider<List<QuoteRequest>>((ref) => ref.read(quotesApiProvider).list());

class QuotesScreen extends ConsumerWidget {
  const QuotesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quotes = ref.watch(_quotesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Mes devis')),
      body: quotes.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (list) => list.isEmpty
            ? const EmptyState(icon: Icons.description_outlined, title: 'Aucun devis pour le moment')
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(_quotesProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final q = list[i];
                    return Card(
                      child: ListTile(
                        leading: const CircleAvatar(child: Icon(Icons.description_outlined)),
                        title: Text(q.reference, style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text('${q.quantity} pièces • ${formatDate(q.createdAt)}'),
                        trailing: _statusChip(q.status),
                        onTap: () => context.push('/quotes/${q.id}'),
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }

  Widget _statusChip(String status) {
    final isMatched = status == 'matched';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isMatched ? Colors.green.shade100 : Colors.amber.shade100,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        isMatched ? 'Offres reçues' : status,
        style: TextStyle(
          color: isMatched ? Colors.green.shade800 : Colors.amber.shade800,
          fontWeight: FontWeight.w600,
          fontSize: 11,
        ),
      ),
    );
  }
}
