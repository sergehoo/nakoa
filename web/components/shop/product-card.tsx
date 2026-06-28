"use client";

import Link from "next/link";
import { Eye, Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { ProductIcon } from "@/components/shop/product-icon";
import type { Product } from "@/lib/api/types";

/**
 * Carte produit universelle de la boutique Nakoa.
 *
 * Affiche image (avec fallback icône), nom, prix "à partir de" ou "Sur devis",
 * description courte, et 3 actions : Voir détails / Ajouter au panier / Wishlist.
 */
export function ProductCard({
  product,
  fromPrice,
  currency = "XOF",
}: {
  product: Product;
  fromPrice?: number | null;
  currency?: string;
}) {
  const cart = useCart();
  const wishlist = useWishlist();

  const cover = product.primary_image || product.cover_image || null;
  const wished = wishlist.isWished(product.id);
  const hasPrice = typeof fromPrice === "number" && fromPrice > 0;

  const onAddToCart = () => {
    cart.addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: cover,
      unitPrice: hasPrice ? Number(fromPrice) : 0,
      currency,
      quantity: product.min_quantity || 1,
      options: {},
      optionsLabel: hasPrice ? undefined : "Sur devis",
    });
    toast.success("Ajouté au panier", {
      description: product.name,
      action: { label: "Voir", onClick: () => (window.location.href = "/cart") },
    });
  };

  const onToggleWishlist = () => {
    const result = wishlist.toggle({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: cover,
      unitPrice: hasPrice ? Number(fromPrice) : 0,
      currency,
      shortDescription: product.short_description,
    });
    if (result === "added") {
      toast.success("Ajouté à votre liste de souhaits", { description: product.name });
    } else {
      toast.message("Retiré de votre liste de souhaits", { description: product.name });
    }
  };

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pink-500/10">
      {/* Visuel */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block"
        aria-label={`Voir ${product.name}`}
      >
        <ProductIcon
          product={{
            slug: product.slug,
            name: product.name,
            primary_image: cover,
            category_name: product.category_name,
            category: typeof product.category === "object" ? product.category : undefined,
          }}
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {product.is_featured && (
          <Badge className="absolute left-2 top-2 bg-pink-500 text-white shadow-md">
            Populaire
          </Badge>
        )}

        {/* Heart toggle en surimpression */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist();
          }}
          aria-label={wished ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow-md backdrop-blur transition hover:scale-110 ${
            wished ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
          }`}
        >
          <Heart className="h-4 w-4" fill={wished ? "currentColor" : "none"} />
        </button>
      </Link>

      {/* Contenu */}
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-display text-base font-semibold leading-tight">
            <Link href={`/products/${product.slug}`} className="hover:text-pink-500">
              {product.name}
            </Link>
          </h3>
          {product.short_description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {product.short_description}
            </p>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          {hasPrice ? (
            <>
              <span className="text-[10px] uppercase text-muted-foreground">À partir de</span>
              <span className="font-display text-lg font-bold">
                {formatCurrency(Number(fromPrice))}
              </span>
              <span className="text-xs text-muted-foreground">{currency}</span>
            </>
          ) : (
            <span className="font-display text-base font-semibold text-muted-foreground">
              Sur devis
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/products/${product.slug}`}>
              <Eye className="mr-1.5 h-3.5 w-3.5" /> Voir détails
            </Link>
          </Button>
          <Button onClick={onAddToCart} size="sm" className="w-full">
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            Ajouter au panier
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
