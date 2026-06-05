"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

// ============================================================
// Types
// ============================================================
export interface PrinterProduct {
  id: string;
  printer: string;
  product: string;
  product_detail?: {
    id: string;
    name: string;
    slug: string;
    short_description: string;
    cover_image: string | null;
    category_id: string;
    category_name: string | null;
    lead_time_days: number;
    min_quantity: number;
  };
  min_price: string;
  setup_cost: string;
  currency: string;
  daily_capacity: number;
  standard_lead_time_days: number;
  express_lead_time_days: number;
  express_surcharge_pct: string;
  is_express_available: boolean;
  supported_formats: string[];
  supported_finishes: string[];
  supported_papers: string[];
  custom_options: Record<string, unknown>;
  notes: string;
  is_active: boolean;
  orders_count: number;
  last_order_at: string | null;
  created_at: string;
}

export interface AvailableProduct {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  cover_image: string | null;
  category: { id: string; name: string; slug: string };
  min_quantity: number;
  lead_time_days: number;
}

// ============================================================
// Hooks
// ============================================================
export function useMyPrinterProducts(filters?: { search?: string; category?: string; is_active?: boolean }) {
  return useQuery<{ results: PrinterProduct[] } | PrinterProduct[]>({
    queryKey: ["my-printer-products", filters],
    queryFn: async () => {
      const { data } = await api.get(endpoints.printers.printerProducts, { params: filters });
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
  });
}

export function useAvailableCatalogProducts(filters?: { search?: string; category?: string }) {
  return useQuery<{ results: AvailableProduct[]; count: number }>({
    queryKey: ["available-catalog-products", filters],
    queryFn: async () => {
      const { data } = await api.get(endpoints.printers.printerProductAvailable, { params: filters });
      return data;
    },
  });
}

export function useBulkActivateProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      product_ids: string[];
      defaults?: {
        min_price?: number;
        setup_cost?: number;
        currency?: string;
        daily_capacity?: number;
        standard_lead_time_days?: number;
        express_lead_time_days?: number;
      };
    }) => {
      const { data } = await api.post(endpoints.printers.printerProductBulkActivate, payload);
      return data as { created: number; skipped: number; results: PrinterProduct[] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-printer-products"] });
      qc.invalidateQueries({ queryKey: ["available-catalog-products"] });
    },
  });
}

export function useUpdatePrinterProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<PrinterProduct> }) => {
      const { data } = await api.patch(endpoints.printers.printerProductDetail(id), payload);
      return data as PrinterProduct;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-printer-products"] }),
  });
}

export function useDeletePrinterProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.printers.printerProductDetail(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-printer-products"] });
      qc.invalidateQueries({ queryKey: ["available-catalog-products"] });
    },
  });
}

// Catalogue public : voir les offres imprimeurs disponibles pour un produit
export interface ProductOffering {
  id: string;
  min_price: string;
  currency: string;
  standard_lead_time_days: number;
  express_lead_time_days: number;
  is_express_available: boolean;
  printer_detail: {
    id: string;
    trade_name: string;
    slug: string;
    city: string;
    country: string;
    quality_score: number;
    on_time_rate: number;
    is_featured: boolean;
  };
}

export function useProductOfferings(productSlugOrId: string | undefined) {
  return useQuery<{ results: ProductOffering[] } | ProductOffering[]>({
    queryKey: ["product-offerings", productSlugOrId],
    enabled: !!productSlugOrId,
    queryFn: async () => {
      const { data } = await api.get(endpoints.printers.productOfferings, {
        params: { product: productSlugOrId },
      });
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
  });
}
