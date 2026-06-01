import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/errors.dart';
import '../../../data/api/catalog_api.dart';
import '../../../data/api/quotes_api.dart';
import '../../../data/models/product.dart';
import '../../../shared/widgets/app_button.dart';

final _productProvider =
    FutureProvider.family<Product, String>((ref, slug) => ref.read(catalogApiProvider).product(slug));

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({super.key, required this.slug});
  final String slug;

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  final _quantityCtrl = TextEditingController(text: '500');
  final Map<String, String> _selectedOptions = {};
  bool _submitting = false;

  Future<void> _requestQuote(Product product) async {
    setState(() => _submitting = true);
    try {
      final qr = await ref.read(quotesApiProvider).create(
            productId: product.id,
            quantity: int.tryParse(_quantityCtrl.text) ?? product.minQuantity,
            optionValueIds: _selectedOptions.values.where((v) => v.isNotEmpty).toList(),
          );
      await ref.read(quotesApiProvider).submit(qr.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Demande envoyée')));
        context.go('/quotes/${qr.id}');
      }
    } on AppException catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final product = ref.watch(_productProvider(widget.slug));
    return Scaffold(
      body: product.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (p) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 260,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                background: p.coverImage != null
                    ? CachedNetworkImage(imageUrl: p.coverImage!, fit: BoxFit.cover)
                    : Container(color: theme.colorScheme.primary.withOpacity(0.1)),
                title: Text(p.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  Text(p.shortDescription,
                      style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor)),
                  const SizedBox(height: 20),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Quantité', style: TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _quantityCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(suffixText: 'min. ${p.minQuantity}'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  ...p.options.map(
                    (opt) => Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(opt.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: opt.values.map((v) {
                                  final selected = _selectedOptions[opt.id] == v.id;
                                  return ChoiceChip(
                                    label: Text(v.label),
                                    selected: selected,
                                    onSelected: (_) => setState(() => _selectedOptions[opt.id] = v.id),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.schedule, size: 16),
                      const SizedBox(width: 6),
                      Text('${p.leadTimeDays} jours ouvrés', style: const TextStyle(fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  AppButton(
                    label: 'Recevoir des offres',
                    icon: Icons.send_rounded,
                    onPressed: () => _requestQuote(p),
                    loading: _submitting,
                  ),
                  const SizedBox(height: 8),
                  const Center(
                    child: Text(
                      'Gratuit • Sans engagement • Réponse en moins de 10 s',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
