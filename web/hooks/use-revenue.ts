"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

// ============================================================
// Types
// ============================================================
export type RevenueSource = {
  id: string;
  code: string;
  kind: string;
  kind_label: string;
  label: string;
  description: string;
  is_enabled: boolean;
  icon: string;
  sort_order: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MonetizationConfigData = {
  id: string;
  default_currency: string;
  default_vat_rate: string;
  default_commission_rate: string;
  default_commission_min: string;
  default_commission_max: string | null;
  log_evaluations: boolean;
  commissions_kill_switch: boolean;
};

export type CommissionRule = {
  id: string;
  source: string;
  source_label: string;
  name: string;
  description: string;
  is_active: boolean;
  conditions: Record<string, unknown>;
  calculation_type: "percentage" | "fixed" | "combined";
  calculation_type_label: string;
  percentage: string;
  fixed_amount: string;
  min_commission: string;
  max_commission: string | null;
  priority: number;
  stacking: "stop_on_match" | "additive";
  active_from: string | null;
  active_until: string | null;
  applies_to_country: string;
  applies_to_currency: string;
  created_at: string;
  updated_at: string;
};

export type RuleVersion = {
  id: string;
  rule: string;
  version_number: number;
  snapshot: Record<string, unknown>;
  changed_by: string | null;
  changed_by_email: string | null;
  reason: string;
  created_at: string;
};

export type AuditEntry = {
  id: string;
  actor: string | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string;
  target_label: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason: string;
  created_at: string;
};

export type RevenueDashboardData = {
  kpis: {
    today: string;
    week: string;
    month: string;
    year: string;
    all_time: string;
  };
  by_source_30d: { code: string; label: string; kind: string; total: string }[];
  series_90d: { day: string; total: string }[];
  by_country_365d: { country: string; total: string }[];
  sources_status: { code: string; label: string; kind: string; is_enabled: boolean }[];
};

// ============================================================
// Hooks
// ============================================================
export function useRevenueDashboard() {
  return useQuery<RevenueDashboardData>({
    queryKey: ["revenue", "dashboard"],
    queryFn: async () => {
      const { data } = await api.get<RevenueDashboardData>(endpoints.revenue.dashboard);
      return data;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

type PaginatedOrList<T> = T[] | { results: T[]; count: number };

function unwrap<T>(payload: PaginatedOrList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

export function useRevenueSources() {
  return useQuery<RevenueSource[]>({
    queryKey: ["revenue", "sources"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<RevenueSource>>(endpoints.revenue.sources);
      return unwrap(data);
    },
  });
}

export function useToggleSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, reason }: { code: string; reason?: string }) => {
      const { data } = await api.post<RevenueSource>(
        endpoints.revenue.sourceToggle(code),
        { reason: reason ?? "" },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["revenue", "sources"] });
      qc.invalidateQueries({ queryKey: ["revenue", "dashboard"] });
    },
  });
}

export function useMonetizationConfig() {
  return useQuery<MonetizationConfigData>({
    queryKey: ["revenue", "config"],
    queryFn: async () => {
      const { data } = await api.get<MonetizationConfigData>(endpoints.revenue.config);
      return data;
    },
  });
}

export function useUpdateMonetizationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<MonetizationConfigData> & { reason?: string }) => {
      const { data } = await api.patch<MonetizationConfigData>(
        endpoints.revenue.configUpdate,
        patch,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["revenue", "config"] });
    },
  });
}

export function useCommissionRules() {
  return useQuery<CommissionRule[]>({
    queryKey: ["revenue", "rules"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<CommissionRule>>(endpoints.revenue.rules);
      return unwrap(data);
    },
  });
}

export function useCreateCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CommissionRule>) => {
      const { data } = await api.post<CommissionRule>(endpoints.revenue.rules, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revenue", "rules"] }),
  });
}

export function useUpdateCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CommissionRule> & { id: string }) => {
      const { data } = await api.patch<CommissionRule>(
        endpoints.revenue.ruleDetail(id),
        payload,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revenue", "rules"] }),
  });
}

export function useDeleteCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(endpoints.revenue.ruleDetail(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revenue", "rules"] }),
  });
}

export function useValidateDsl() {
  return useMutation({
    mutationFn: async (payload: { conditions: unknown; context?: unknown }) => {
      const { data } = await api.post<{ ok: boolean; matched?: boolean; error?: string }>(
        endpoints.revenue.ruleValidate,
        payload,
      );
      return data;
    },
  });
}

export function useAuditLog() {
  return useQuery<AuditEntry[]>({
    queryKey: ["revenue", "audit"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<AuditEntry>>(endpoints.revenue.audit);
      return unwrap(data);
    },
  });
}
