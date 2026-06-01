import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../data/api/catalog_api.dart';
import '../../../data/models/product.dart';
import '../../../shared/widgets/app_scaffold.dart';
import '../../../shared/widgets/empty_state.dart';

final _categoriesProvider = FutureProvider<List<Category>>((ref) => ref.read(catalogApiProvider).categories());
final _selectedCategoryProvider = StateProvider<String?>((ref) => null);
final _searchProvider = StateProvider<String>((ref) => '');

final _productsProvider = FutureProvider<List<Product>>((ref) async {
  final cat = ref.watch(_selectedCategoryProvider);
  final q = ref.watch(_searchProvider);
  return ref.read(catalogApiProvider).products(category: cat, search: q);
});

class CatalogScreen extends ConsumerWidget {
  const CatalogScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final categories = ref.watch(_categoriesProvider);
    final products = ref.watch(_productsProvider);
    final selectedCat = ref.watch(_selectedCategoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Catalogue'), elevation: 0),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Rechercher un produit…',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (v) => ref.read(_searchProvider.notifier).state = v,
            ),
          ),
          SizedBox(
            height: 44,
            child: categories.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (list) => ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _CategoryChip(
                    label: 'Toutes',
                    selected: selectedCat == null,
                    onTap: () => ref.read(_selectedCategoryProvider.notifier).state = null,
                  ),
                  ...list.map((c) => _CategoryChip(
                        label: c.name,
                        selected: selectedCat == c.id,
                        onTap: () => ref.read(_selectedCategoryProvider.notifier).state = c.id,
                      )),
                ],
              ),
            ),
          ),
          Expanded(
            child: products.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Erreur : $e')),
              data: (list) => list.isEmpty
                  ? const EmptyState(icon: Icons.inventory_2_outlined, title: 'Aucun produit')
                  : RefreshIndicator(
                      onRefresh: () async => ref.invalidate(_productsProvider),
                      child: GridView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: list.length,
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.74,
                        ),
                        itemBuilder: (_, i) => _ProductTile(product: list[i]),
                      ),
                    ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 1),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: theme.colorScheme.primary.withOpacity(0.15),
        labelStyle: TextStyle(color: selected ? theme.colorScheme.primary : null),
      ),
    );
  }
}

class _ProductTile extends StatelessWidget {
  const _ProductTile({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => context.push('/catalog/${product.slug}'),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 4 / 3,
              child: product.primaryImage != null
                  ? CachedNetworkImage(
                      imageUrl: product.primaryImage!,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: theme.dividerColor),
                      errorWidget: (_, __, ___) => Icon(Icons.image_not_supported_outlined, color: theme.hintColor),
                    )
                  : Container(
                      color: theme.colorScheme.primary.withOpacity(0.08),
                      child: Icon(Icons.print_outlined, color: theme.colorScheme.primary, size: 32),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (product.categoryName != null)
                    Text(product.categoryName!, style: TextStyle(fontSize: 10, color: theme.hintColor)),
                  Text(product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  const SizedBox(height: 4),
                  Text(
                    '${product.minQuantity}+ pièces • ${product.leadTimeDays}j',
                    style: TextStyle(fontSize: 11, color: theme.hintColor),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
