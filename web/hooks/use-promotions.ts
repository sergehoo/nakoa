"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

// ============================================================
// Types
// ============================================================
export type Campaign = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "draft" | "active" | "paused" | "ended";
  status_label: string;
  discount_type: "percentage" | "fixed" | "free_shipping" | "credit";
  discount_type_label: string;
  discount_value: string;
  currency: string;
  max_discount_amount: string | null;
  min_order_amount: string;
  starts_at: string;
  ends_at: string | null;
  total_usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  conditions: Record<string, unknown>;
  is_public: boolean;
  codes_count: number;
  created_at: string;
  updated_at: string;
};

export type CouponCode = {
  id: string;
  campaign: string;
  campaign_name: string;
  campaign_status: string;
  code: string;
  max_redemptions: number | null;
  redemption_count: number;
  is_active: boolean;
  expires_at: string | null;
  restricted_to_user: string | null;
  is_usable_now: boolean;
  created_at: string;
};

export type Redemption = {
  id: string;
  code: string;
  code_value: string;
  campaign: string;
  campaign_name: string;
  user: string;
  user_email: string;
  order_id: string | null;
  discount_amount: string;
  currency: string;
  status: "pending" | "applied" | "reversed";
  reversal_reason: string;
  created_at: string;
};

export type ValidateResult = {
  ok: boolean;
  reason: string | null;
  discount_amount: string;
  discount_type: string;
  currency: string;
  code: string | null;
  campaign_name: string | null;
};

type PaginatedOrList<T> = T[] | { results: T[]; count: number };
const unwrap = <T,>(p: PaginatedOrList<T>): T[] => (Array.isArray(p) ? p : p.results);

// ============================================================
// Customer — validation d'un code
// ============================================================
export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (payload: {
      code: string;
      order_total: number | string;
      order_id?: string;
    }) => {
      try {
        const { data } = await api.post<ValidateResult>(
          endpoints.promotions.validate,
          payload,
        );
        return data;
      } catch (e: unknown) {
        // Backend renvoie 400 quand ok=false, on récupère quand même le payload
        const err = e as { response?: { status?: number; data?: ValidateResult } };
        if (err?.response?.status === 400 && err.response.data) return err.response.data;
        throw e;
      }
    },
  });
}

// ============================================================
// Super Admin — campagnes
// ============================================================
export function useCampaigns() {
  return useQuery<Campaign[]>({
    queryKey: ["promotions", "campaigns"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<Campaign>>(endpoints.promotions.campaigns);
      return unwrap(data);
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Campaign>) => {
      const { data } = await api.post<Campaign>(endpoints.promotions.campaigns, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Campaign> & { id: string }) => {
      const { data } = await api.patch<Campaign>(endpoints.promotions.campaignDetail(id), payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(endpoints.promotions.campaignDetail(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });
}

export function useGenerateCodes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, ...payload }: {
      campaignId: string;
      count: number;
      prefix?: string;
      length?: number;
    }) => {
      const { data } = await api.post<{ created: number; codes: CouponCode[] }>(
        endpoints.promotions.campaignGenerate(campaignId),
        payload,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });
}

// ============================================================
// Super Admin — codes & redemptions
// ============================================================
export function useCouponCodes(campaignId?: string) {
  return useQuery<CouponCode[]>({
    queryKey: ["promotions", "codes", campaignId ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<CouponCode>>(
        endpoints.promotions.codes,
        { params: campaignId ? { campaign: campaignId } : undefined },
      );
      return unwrap(data);
    },
  });
}

export function useDeleteCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(endpoints.promotions.codeDetail(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["promotions"] }),
  });
}

export function useRedemptions(filter?: { status?: string }) {
  return useQuery<Redemption[]>({
    queryKey: ["promotions", "redemptions", filter ?? {}],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<Redemption>>(
        endpoints.promotions.redemptions,
        { params: filter },
      );
      return unwrap(data);
    },
  });
}
