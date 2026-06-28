"use client";

import { useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type { Category, Paginated, Product } from "@/lib/api/types";

export function useCategories() {
  return useQuery<Paginated<Category>>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.catalog.categories);
      return data;
    },
  });
}

export type ProductFilters = {
  category?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  price_min?: number | string;
  price_max?: number | string;
  rating_min?: number | string;
  lead_time_max?: number | string;
  printer?: string;
  in_stock?: boolean;
};

export function useProducts(filters?: ProductFilters) {
  return useQuery<Paginated<Product>>({
    queryKey: ["products", filters],
    queryFn: async () => {
      // Nettoie les valeurs vides pour éviter ?price_min=&category=
      const params: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(filters ?? {})) {
        if (v === undefined || v === null || v === "") continue;
        if (typeof v === "boolean") {
          if (v) params[k] = "1";
        } else {
          params[k] = v;
        }
      }
      const { data } = await api.get(endpoints.catalog.products, { params });
      return data;
    },
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery<Product>({
    queryKey: ["product", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get(endpoints.catalog.productBySlug(slug!));
      return data;
    },
  });
}
