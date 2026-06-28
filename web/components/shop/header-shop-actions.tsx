"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { useShopHydrated } from "@/hooks/use-shop-hydration";

/**
 * Boutons panier + wishlist avec compteur live à intégrer dans le header
 * marketing. SSR-safe : pendant l'hydratation on n'affiche pas le badge
 * pour éviter un mismatch.
 */
export function HeaderShopActions() {
  const hydrated = useShopHydrated();
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishlistCount = useWishlist((s) => s.items.length);

  return (
    <div className="flex items-center gap-1">
      <Button
        asChild variant="ghost" size="sm"
        className="relative h-9 w-9 px-0"
        aria-label="Liste de souhaits"
      >
        <Link href="/wishlist">
          <Heart className="h-4 w-4" />
          {hydrated && wishlistCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </Link>
      </Button>

      <Button
        asChild variant="ghost" size="sm"
        className="relative h-9 w-9 px-0"
        aria-label="Panier"
      >
        <Link href="/cart">
          <ShoppingCart className="h-4 w-4" />
          {hydrated && cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>
      </Button>
    </div>
  );
}
