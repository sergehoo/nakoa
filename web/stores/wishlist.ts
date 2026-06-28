"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WishlistItem = {
  productId: string;
  productSlug: string;
  productName: string;
  productImage?: string | null;
  unitPrice: number;
  currency: string;
  shortDescription?: string;
  addedAt: number;
};

type WishlistState = {
  items: WishlistItem[];
  isWished: (productId: string) => boolean;
  toggle: (item: Omit<WishlistItem, "addedAt">) => "added" | "removed";
  remove: (productId: string) => void;
  clear: () => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isWished: (productId) => get().items.some((i) => i.productId === productId),
      toggle: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) {
          set((s) => ({ items: s.items.filter((i) => i.productId !== item.productId) }));
          return "removed";
        }
        set((s) => ({ items: [...s.items, { ...item, addedAt: Date.now() }] }));
        return "added";
      },
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "nakoa.wishlist.v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
