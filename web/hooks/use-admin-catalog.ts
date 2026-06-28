"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

// ============================================================
// Catégories
// ============================================================
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  is_active: boolean;
  parent: string | null;
  products_count?: number;
  created_at: string;
}

interface AdminCategoriesShape {
  results: AdminCategory[];
  count: number;
}

export function useAdminCategories() {
  return useQuery<AdminCategory[] | AdminCategoriesShape, Error, AdminCategoriesShape>({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.admin.catalogCategories, {
        params: { page_size: 200 },
      });
      return data;
    },
    select: (raw): AdminCategoriesShape => {
      if (Array.isArray(raw)) return { results: raw, count: raw.length };
      return raw;
    },
  });
}

export function useSaveAdminCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<AdminCategory> }) => {
      if (id) {
        const { data } = await api.patch(endpoints.admin.catalogCategoryDetail(id), payload);
        return data;
      }
      const { data } = await api.post(endpoints.admin.catalogCategories, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });
}

export function useDeleteAdminCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.admin.catalogCategoryDetail(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });
}

// ============================================================
// Produits
// ============================================================
export interface AdminProduct {
  id: string;
  category: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  min_quantity: number;
  max_quantity: number;
  lead_time_days: number;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  printers_count?: number;
  cover_image: string | null;
  created_at: string;
}

export interface AdminProductFilters {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  is_active?: boolean;
  uncovered?: boolean;
  ordering?: string;
}

export function useAdminProducts(filters: AdminProductFilters = {}) {
  return useQuery<{ results: AdminProduct[]; count: number; next: string | null; previous: string | null }>({
    queryKey: ["admin-products", filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get(endpoints.admin.catalogProducts, { params: filters });
      if (Array.isArray(data)) {
        return { results: data, count: data.length, next: null, previous: null };
      }
      return data;
    },
  });
}

export function useAdminCatalogStats() {
  return useQuery<{
    total_products: number;
    active_products: number;
    uncovered_products: number;
    categories: { id: string; name: string; slug: string; total: number; active: number }[];
  }>({
    queryKey: ["admin-catalog-stats"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.admin.catalogProductsStats);
      return data;
    },
  });
}

export function useSaveAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<AdminProduct> }) => {
      if (id) {
        const { data } = await api.patch(endpoints.admin.catalogProductDetail(id), payload);
        return data;
      }
      const { data } = await api.post(endpoints.admin.catalogProducts, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-catalog-stats"] });
    },
  });
}

export function useDeleteAdminProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.admin.catalogProductDetail(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-catalog-stats"] });
    },
  });
}

export function useImportCatalogCsv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(endpoints.admin.catalogProductsImportCsv, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data as {
        created: number;
        updated: number;
        errors: { line: number; error: string }[];
        total_processed: number;
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-catalog-stats"] });
    },
  });
}
