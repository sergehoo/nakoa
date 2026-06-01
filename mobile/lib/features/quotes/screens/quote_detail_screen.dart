import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors.dart';
import '../../../data/api/quotes_api.dart';
import '../../../data/models/quote.dart';
import '../../../shared/utils/formatters.dart';

final _quoteProvider = FutureProvider.family.autoDispose<QuoteRequest, String>((ref, id) async {
  return ref.read(quotesApiProvider).detail(id);
});

class QuoteDetailScreen extends ConsumerStatefulWidget {
  const QuoteDetailScreen({super.key, required this.id});
  final String id;

  @override
  ConsumerState<QuoteDetailScreen> createState() => _QuoteDetailScreenState();
}

class _QuoteDetailScreenState extends ConsumerState<QuoteDetailScreen> {
  bool _converting = false;

  Future<void> _select(QuoteOffer offer) async {
    setState(() => _converting = true);
    try {
      await ref.read(quotesApiProvider).selectOffer(quoteId: widget.id, offerId: offer.id);
      final r = await ref.read(quotesApiProvider).convert(widget.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Commande créée')));
        context.go('/orders/${r['order_id']}');
      }
    } on AppException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _converting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final quote = ref.watch(_quoteProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: const Text('Offres')),
      body: quote.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (q) {
          if (q.status == 'open' || q.status == 'draft') {
            return _Waiting(onRefresh: () => ref.invalidate(_quoteProvider(widget.id)));
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(_quoteProvider(widget.id)),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: q.offers.length + 1,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                if (i == 0) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(q.reference,
                          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                      Text('${q.quantity} pièces',
                          style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor)),
                      const SizedBox(height: 12),
                    ],
                  );
                }
                final o = q.offers[i - 1];
                return _OfferCard(offer: o, onSelect: _converting ? null : () => _select(o));
              },
            ),
          );
        },
      ),
    );
  }
}

class _Waiting extends StatelessWidget {
  const _Waiting({required this.onRefresh});
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 24),
            const Text('Le moteur IA analyse les imprimeurs disponibles…',
                textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            const Text('Vos offres arrivent en quelques secondes.',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 12)),
            const SizedBox(height: 24),
            OutlinedButton(onPressed: onRefresh, child: const Text('Actualiser')),
          ],
        ),
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  const _OfferCard({required this.offer, required this.onSelect});
  final QuoteOffer offer;
  final VoidCallback? onSelect;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isAI = offer.isAiRecommended;
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: isAI ? theme.colorScheme.primary : Colors.transparent, width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(offer.printerName,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      Text(
                        '${offer.printerCity} • Score ${offer.qualityScore.toStringAsFixed(0)}/100',
                        style: TextStyle(fontSize: 12, color: theme.hintColor),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isAI ? theme.colorScheme.primary.withOpacity(0.12) : Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    offer.tagLabel,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isAI ? theme.colorScheme.primary : Colors.grey.shade800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Prix TTC', style: TextStyle(fontSize: 11, color: Colors.grey)),
                      Text(formatCurrency(offer.totalInclTax, offer.currency),
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Délai', style: TextStyle(fontSize: 11, color: Colors.grey)),
                      Text('${offer.leadTimeDays} j', style: const TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: onSelect,
                icon: const Icon(Icons.check_rounded),
                label: const Text('Choisir cette offre'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
