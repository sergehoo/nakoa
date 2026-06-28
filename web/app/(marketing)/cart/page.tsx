"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Minus, Package, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/stores/cart";
import { useShopHydrated } from "@/hooks/use-shop-hydration";
import { formatCurrency } from "@/lib/utils";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function CartPage() {
  const hydrated = useShopHydrated();
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const clear = useCart((s) => s.clear);
  const subtotal = useCart((s) => s.subtotal());

  // SSR-safe : on n'affiche le contenu qu'après hydratation
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
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Ton panier est vide
          </h1>
          <p className="text-muted-foreground">
            Ajoute des produits depuis notre catalogue pour les retrouver ici.
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
        <h1 className="font-display text-3xl font-bold tracking-tight">Mon panier</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clear();
            toast.message("Panier vidé");
          }}
          className="text-muted-foreground"
        >
          Vider le panier
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Articles */}
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <Card key={item.lineId}>
              <CardContent className="flex gap-4 p-4">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary"
                >
                  {item.productImage ? (
                    <Image
                      src={item.productImage} alt={item.productName}
                      fill sizes="96px" className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="line-clamp-1 font-semibold hover:text-pink-500"
                      >
                        {item.productName}
                      </Link>
                      {item.optionsLabel && (
                        <p className="text-xs text-muted-foreground">{item.optionsLabel}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeItem(item.lineId);
                        toast.message("Produit retiré");
                      }}
                      aria-label="Retirer"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    {/* Stepper quantité */}
                    <div className="inline-flex items-center rounded-md border">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                        aria-label="Diminuer"
                        className="px-2 py-1 text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.lineId, Number(e.target.value) || 1)
                        }
                        className="w-14 border-x bg-transparent px-2 py-1 text-center text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                        aria-label="Augmenter"
                        className="px-2 py-1 text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Prix ligne */}
                    <div className="text-right">
                      {item.unitPrice > 0 ? (
                        <>
                          <p className="font-semibold">
                            {formatCurrency(item.unitPrice * item.quantity)}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              {item.currency}
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatCurrency(item.unitPrice)} / unité
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">
                          Sur devis
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Récapitulatif */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-semibold">Récapitulatif</h2>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Articles</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>
                    {subtotal > 0 ? formatCurrency(subtotal) : "Sur devis"}
                  </span>
                </div>
                <p className="pt-1 text-xs text-muted-foreground">
                  Livraison et taxes calculées au paiement.
                </p>
              </div>

              <Separator />

              <Button asChild size="lg" className="w-full">
                <Link href="/checkout">
                  Passer commande <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/products">Continuer mes achats</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
