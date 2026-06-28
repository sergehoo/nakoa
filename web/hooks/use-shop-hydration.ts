"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";

/**
 * Déclenche l'hydratation des stores cart+wishlist (skipHydration=true)
 * après montage côté client. Retourne true quand prêt.
 */
export function useShopHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    useCart.persist.rehydrate();
    useWishlist.persist.rehydrate();
    setHydrated(true);
  }, []);
  return hydrated;
}
