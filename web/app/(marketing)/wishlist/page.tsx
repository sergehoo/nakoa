"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Package, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWishlist } from "@/stores/wishlist";
import { useCart } from "@/stores/cart";
import { useShopHydrated } from "@/hooks/use-shop-hydration";
import { formatCurrency } from "@/lib/utils";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function WishlistPage() {
  const hydrated = useShopHydrated();
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.remove);
  const cart = useCart();

  if (!hydrated) {
    return (
      <>
        <MarketingHeader />
        <div className="container py-12">
          <div className="h-40 animate-pulse rounded-2xl bg-secondary/30" />
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <MarketingHeader />
        <div className="container py-16">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Ta liste de souhaits est vide
          </h1>
          <p className="text-muted-foreground">
            Clique sur le cœur d'un produit pour l'y ajouter et le retrouver ici.
          </p>
          <Button asChild>
            <Link href="/products">Explorer le catalogue</Link>
          </Button>
        </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MarketingHeader />
      <div className="container py-10">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Liste de souhaits
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} produit{items.length > 1 ? "s" : ""} sauvegardé
            {items.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.productId} className="flex flex-col">
            <Link
              href={`/products/${item.productSlug}`}
              className="relative block aspect-[4/3] overflow-hidden bg-secondary/40"
            >
              {item.productImage ? (
                <Image
                  src={item.productImage} alt={item.productName}
                  fill sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
            </Link>
            <CardContent className="flex flex-1 flex-col gap-3 p-4">
              <div>
                <h3 className="line-clamp-1 font-semibold">
                  <Link href={`/products/${item.productSlug}`} className="hover:text-pink-500">
                    {item.productName}
                  </Link>
                </h3>
                {item.shortDescription && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.shortDescription}
                  </p>
                )}
              </div>
              <p className="text-sm">
                {item.unitPrice > 0 ? (
                  <>
                    À partir de{" "}
                    <span className="font-semibold">{formatCurrency(item.unitPrice)}</span>{" "}
                    <span className="text-xs text-muted-foreground">{item.currency}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Sur devis</span>
                )}
              </p>
              <div className="mt-auto flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    cart.addItem({
                      productId: item.productId,
                      productSlug: item.productSlug,
                      productName: item.productName,
                      productImage: item.productImage,
                      unitPrice: item.unitPrice,
                      currency: item.currency,
                      quantity: 1,
                      options: {},
                    });
                    toast.success("Ajouté au panier");
                  }}
                >
                  <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Au panier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    remove(item.productId);
                    toast.message("Retiré de la liste");
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Retirer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </>
  );
}
