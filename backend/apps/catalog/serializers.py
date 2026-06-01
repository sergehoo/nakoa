from rest_framework import serializers

from .models import (
    Category,
    Product,
    ProductImage,
    ProductOption,
    ProductOptionValue,
    ProductTemplate,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "parent", "slug", "name", "description", "icon", "cover", "is_active", "position"]


class ProductOptionValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOptionValue
        fields = ["id", "code", "label", "extra_cost_pct", "extra_cost_amount", "metadata", "position"]


class ProductOptionSerializer(serializers.ModelSerializer):
    values = ProductOptionValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProductOption
        fields = ["id", "kind", "name", "required", "position", "values"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt", "position", "is_primary"]


class ProductTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTemplate
        fields = ["id", "name", "file", "format"]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "slug", "name", "short_description", "category", "category_name",
            "primary_image", "lead_time_days", "min_quantity", "is_featured",
        ]

    def get_primary_image(self, obj):
        first = obj.images.filter(is_primary=True).first() or obj.images.first()
        return first.image.url if first and first.image else None


class ProductDetailSerializer(serializers.ModelSerializer):
    options = ProductOptionSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    templates = ProductTemplateSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "slug", "name", "short_description", "description",
            "category", "specifications", "min_quantity", "max_quantity",
            "lead_time_days", "is_featured", "tags", "cover_image",
            "options", "images", "templates",
        ]
