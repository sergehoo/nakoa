"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

export type PremiumService = {
  id: string;
  code: string;
  name: string;
  description: string;
  short_description: string;
  icon: string;
  category: string | null;
  category_name: string | null;
  pricing_type: "fixed" | "per_unit" | "variable" | "percentage";
  pricing_type_label: string;
  base_price: string;
  percentage: string;
  currency: string;
  is_active: boolean;
  is_visible: boolean;
  is_required: boolean;
  estimated_hours: number;
  applies_to_categories: string[];
  sort_order: number;
};

export type PricedLine = {
  service_code: string;
  service_name: string;
  quantity: number;
  unit_price: string;
  total: string;
};

export type PricingResult = {
  subtotal: string;
  currency: string;
  lines: PricedLine[];
};

type PaginatedOrList<T> = T[] | { results: T[]; count: number };
const unwrap = <T,>(p: PaginatedOrList<T>): T[] => (Array.isArray(p) ? p : p.results);

// ============================================================
// Lecture publique
// ============================================================
export function useServiceCategories() {
  return useQuery<ServiceCategory[]>({
    queryKey: ["premium_services", "categories"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<ServiceCategory>>(
        endpoints.premiumServices.categories,
      );
      return unwrap(data).filter((c) => c.is_active);
    },
  });
}

export function usePremiumServices(categorySlug?: string) {
  return useQuery<PremiumService[]>({
    queryKey: ["premium_services", "list", categorySlug ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<PremiumService>>(
        endpoints.premiumServices.services,
        { params: categorySlug ? { category: categorySlug } : undefined },
      );
      return unwrap(data);
    },
  });
}

// ============================================================
// Pricing
// ============================================================
export function usePriceServices() {
  return useMutation({
    mutationFn: async (payload: {
      selection: { service_code: string; quantity: number }[];
      order_total: number | string;
      currency?: string;
    }) => {
      const { data } = await api.post<PricingResult>(
        endpoints.premiumServices.price,
        payload,
      );
      return data;
    },
  });
}

// ============================================================
// Super Admin CRUD
// ============================================================
export function useAdminServices() {
  return useQuery<PremiumService[]>({
    queryKey: ["premium_services", "admin", "list"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<PremiumService>>(
        endpoints.premiumServices.services,
      );
      return unwrap(data);
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PremiumService>) => {
      const { data } = await api.post<PremiumService>(
        endpoints.premiumServices.services, payload,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["premium_services"] }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<PremiumService> & { id: string }) => {
      const { data } = await api.patch<PremiumService>(
        endpoints.premiumServices.serviceDetail(id), payload,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["premium_services"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(endpoints.premiumServices.serviceDetail(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["premium_services"] }),
  });
}
