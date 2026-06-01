class Category {
  Category({required this.id, required this.slug, required this.name, this.icon});

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as String,
        slug: json['slug'] as String,
        name: json['name'] as String,
        icon: json['icon'] as String?,
      );

  final String id;
  final String slug;
  final String name;
  final String? icon;
}

class ProductOptionValue {
  ProductOptionValue({required this.id, required this.code, required this.label});

  factory ProductOptionValue.fromJson(Map<String, dynamic> json) => ProductOptionValue(
        id: json['id'] as String,
        code: json['code'] as String,
        label: json['label'] as String,
      );

  final String id;
  final String code;
  final String label;
}

class ProductOption {
  ProductOption({
    required this.id,
    required this.kind,
    required this.name,
    required this.required,
    required this.values,
  });

  factory ProductOption.fromJson(Map<String, dynamic> json) => ProductOption(
        id: json['id'] as String,
        kind: json['kind'] as String,
        name: json['name'] as String,
        required: json['required'] as bool? ?? false,
        values: (json['values'] as List<dynamic>? ?? [])
            .map((v) => ProductOptionValue.fromJson(v as Map<String, dynamic>))
            .toList(),
      );

  final String id;
  final String kind;
  final String name;
  final bool required;
  final List<ProductOptionValue> values;
}

class Product {
  Product({
    required this.id,
    required this.slug,
    required this.name,
    required this.shortDescription,
    required this.minQuantity,
    required this.leadTimeDays,
    this.description,
    this.coverImage,
    this.primaryImage,
    this.categoryName,
    this.isFeatured = false,
    this.options = const [],
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'] as String,
        slug: json['slug'] as String,
        name: json['name'] as String,
        shortDescription: json['short_description'] as String? ?? '',
        description: json['description'] as String?,
        coverImage: json['cover_image'] as String?,
        primaryImage: json['primary_image'] as String?,
        categoryName: json['category_name'] as String? ??
            (json['category'] is Map ? (json['category'] as Map)['name'] as String? : null),
        minQuantity: (json['min_quantity'] as num?)?.toInt() ?? 1,
        leadTimeDays: (json['lead_time_days'] as num?)?.toInt() ?? 3,
        isFeatured: json['is_featured'] as bool? ?? false,
        options: (json['options'] as List<dynamic>? ?? [])
            .map((v) => ProductOption.fromJson(v as Map<String, dynamic>))
            .toList(),
      );

  final String id;
  final String slug;
  final String name;
  final String shortDescription;
  final String? description;
  final String? coverImage;
  final String? primaryImage;
  final String? categoryName;
  final int minQuantity;
  final int leadTimeDays;
  final bool isFeatured;
  final List<ProductOption> options;
}
