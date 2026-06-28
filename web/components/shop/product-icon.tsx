"use client";

import Image from "next/image";
import { getProductIcon } from "@/lib/product-icons";

/**
 * Affiche l'image du produit si elle existe, sinon l'icône Lucide
 * la plus pertinente d'après le slug/name/catégorie.
 *
 * Props :
 * - product : {slug?, name?, category? (slug ou nom), primary_image?, cover_image?}
 * - aspect  : ratio "square" (1:1) ou "card" (4:3, défaut)
 * - sizes   : sizes prop de next/image
 */
export function ProductIcon({
  product,
  aspect = "card",
  className,
  sizes,
}: {
  product: {
    slug?: string;
    name?: string;
    primary_image?: string | null;
    cover_image?: string | null;
    category_name?: string | null;
    category?: { slug?: string; name?: string } | string | null;
  };
  aspect?: "square" | "card";
  className?: string;
  sizes?: string;
}) {
  const cover = product.primary_image || product.cover_image || null;
  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-[4/3]";
  const wrapperClass = `relative overflow-hidden bg-gradient-to-br from-secondary/40 to-secondary/10 ${aspectClass} ${className ?? ""}`;

  if (cover) {
    return (
      <div className={wrapperClass}>
        <Image
          src={cover}
          alt={product.name ?? "Produit"}
          fill
          sizes={sizes ?? "(max-width: 768px) 100vw, 25vw"}
          className="object-cover"
        />
      </div>
    );
  }

  const catHints =
    typeof product.category === "string"
      ? [product.category]
      : [product.category?.slug, product.category?.name];

  const Icon = getProductIcon(
    product.slug,
    product.name,
    product.category_name,
    ...catHints,
  );

  return (
    <div className={wrapperClass}>
      <div className="flex h-full items-center justify-center">
        <Icon className="h-1/2 w-1/2 max-h-20 max-w-20 text-muted-foreground" strokeWidth={1.2} />
      </div>
    </div>
  );
}
