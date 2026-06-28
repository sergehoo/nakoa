"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Store du panier Nakoa — entièrement client-side, persisté en localStorage.
 *
 * Pas d'appel API tant que le visiteur n'a pas validé la commande. Une fois
 * authentifié et qu'il confirme le checkout, on POST une QuoteRequest avec
 * tous les items.
 */

export type CartItemOptions = Record<string, string | number | boolean>;

export type CartItem = {
  /** Identifiant unique de la ligne dans le panier (pas l'id produit) */
  lineId: string;
  productId: string;
  productSlug: string;
  productName: string;
  productImage?: string | null;
  unitPrice: number; // 0 si "sur devis"
  currency: string;
  quantity: number;
  options: CartItemOptions; // ex: {format: "A4", finition: "mat"}
  /** Texte libre stocké au moment de l'ajout pour afficher dans le panier */
  optionsLabel?: string;
};

type CartState = {
  items: CartItem[];
  /** Nombre total d'articles (somme des quantités) */
  totalCount: () => number;
  /** Sous-total HT */
  subtotal: () => number;
  /** Ajoute ou incrémente */
  addItem: (item: Omit<CartItem, "lineId">) => void;
  /** Met à jour la quantité (supprime si <= 0) */
  updateQuantity: (lineId: string, quantity: number) => void;
  /** Supprime une ligne */
  removeItem: (lineId: string) => void;
  /** Vide tout le panier */
  clear: () => void;
};

const LINE_ID = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalCount: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      addItem: (item) => {
        set((state) => {
          // Tente de fusionner si même produit + mêmes options
          const sameLine = state.items.find(
            (i) =>
              i.productId === item.productId &&
              JSON.stringify(i.options) === JSON.stringify(item.options),
          );
          if (sameLine) {
            return {
              items: state.items.map((i) =>
                i.lineId === sameLine.lineId
                  ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, lineId: LINE_ID(), quantity: item.quantity || 1 },
            ],
          };
        });
      },
      updateQuantity: (lineId, quantity) => {
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.lineId !== lineId)
              : state.items.map((i) =>
                  i.lineId === lineId ? { ...i, quantity } : i,
                ),
        }));
      },
      removeItem: (lineId) =>
        set((state) => ({ items: state.items.filter((i) => i.lineId !== lineId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "nakoa.cart.v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // important pour SSR Next 15
    },
  ),
);
