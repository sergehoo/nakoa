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

export function useProducts(filters?: {
  category?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}) {
  return useQuery<Paginated<Product>>({
    queryKey: ["products", filters],
    queryFn: async () => {
      const { data } = await api.get(endpoints.catalog.products, { params: filters });
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
