"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

// ============================================================
// Types
// ============================================================
export type Plan = {
  id: string;
  code: string;
  tier: string;
  tier_label: string;
  name: string;
  description: string;
  tagline: string;
  monthly_price: string;
  yearly_price: string;
  currency: string;
  commission_pct: string;
  max_active_orders: number;
  max_team_members: number;
  max_products: number;
  ai_messages_per_month: number;
  features: string[];
  quotas: Record<string, unknown>;
  trial_days: number;
  cta_label: string;
  is_active: boolean;
  is_public: boolean;
  is_highlight: boolean;
  sort_order: number;
  target_role: string;
  target_role_label: string;
};

export type Subscription = {
  id: string;
  subscriber: string;
  subscriber_email?: string;
  plan: string;
  plan_detail: Plan;
  cycle: "monthly" | "yearly";
  status: "trial" | "active" | "past_due" | "cancelled" | "expired";
  started_at: string;
  current_period_end: string;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string;
  provider_reference: string;
  auto_renew: boolean;
  created_at: string;
};

type PaginatedOrList<T> = T[] | { results: T[]; count: number };

function unwrap<T>(payload: PaginatedOrList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

// ============================================================
// Plans publics — /pricing
// ============================================================
export function usePlans(targetRole?: string) {
  return useQuery<Plan[]>({
    queryKey: ["subscriptions", "plans", targetRole ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<Plan>>(endpoints.subscriptions.plans);
      const all = unwrap(data);
      if (!targetRole) return all;
      return all.filter((p) => p.target_role === "any" || p.target_role === targetRole);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// Abonnement courant — /account/subscription
// ============================================================
export function useMySubscription() {
  return useQuery<{ active: boolean } & Partial<Subscription>>({
    queryKey: ["subscriptions", "me"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.subscriptions.me);
      return data;
    },
  });
}

export function useSubscribe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      plan: string;
      cycle?: "monthly" | "yearly";
      start_trial?: boolean;
      provider_reference?: string;
    }) => {
      const { data } = await api.post<{
        subscription: Subscription;
        payment_required: boolean;
        amount: string;
        currency: string;
        payment_reference: string | null;
      }>(endpoints.subscriptions.subscribe, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions", "me"] });
      qc.invalidateQueries({ queryKey: ["subscriptions", "list"] });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { reason?: string } = {}) => {
      const { data } = await api.post<Subscription>(endpoints.subscriptions.cancel, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions", "me"] });
    },
  });
}

// ============================================================
// Super Admin — CRUD plans
// ============================================================
export function useAdminPlans() {
  return useQuery<Plan[]>({
    queryKey: ["subscriptions", "admin", "plans"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<Plan>>(endpoints.subscriptions.plans);
      return unwrap(data);
    },
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Plan>) => {
      const { data } = await api.post<Plan>(endpoints.subscriptions.plans, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Plan> & { id: string }) => {
      const { data } = await api.patch<Plan>(endpoints.subscriptions.planDetail(id), payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(endpoints.subscriptions.planDetail(id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useAdminSubscriptions(filters?: { status?: string; plan?: string }) {
  return useQuery<Subscription[]>({
    queryKey: ["subscriptions", "admin", "list", filters ?? {}],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<Subscription>>(
        endpoints.subscriptions.adminList,
        { params: filters },
      );
      return unwrap(data);
    },
  });
}
