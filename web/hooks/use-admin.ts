"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

// ============================================================
// Utilisateurs (annuaire admin)
// ============================================================
export interface AdminUserListItem {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  primary_role: string;
  country: string;
  is_active: boolean;
  is_suspended: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  two_factor_enabled: boolean;
  kyc_level: number;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUserListItem[];
}

export interface AdminUsersFilters {
  page?: number;
  page_size?: number;
  search?: string;
  primary_role?: string;
  country?: string;
  is_active?: boolean;
  is_suspended?: boolean;
}

export function useAdminUsers(filters: AdminUsersFilters = {}) {
  return useQuery<AdminUsersResponse>({
    queryKey: ["admin-users", filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get(endpoints.admin.users, { params: filters });
      if (Array.isArray(data)) {
        return { count: data.length, next: null, previous: null, results: data };
      }
      return data;
    },
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post(endpoints.admin.userSuspend(id), { reason });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(endpoints.admin.userActivate(id));
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

// ============================================================
// Imprimeurs (annuaire admin)
// ============================================================
export interface AdminPrinter {
  id: string;
  slug: string;
  legal_name: string;
  trade_name: string;
  country: string;
  city: string;
  status: "pending" | "active" | "probation" | "suspended" | "banned";
  kyc_status: "pending" | "submitted" | "approved" | "rejected";
  quality_score: string;
  on_time_rate: string;
  current_load_pct: string;
  daily_capacity_units: number;
  created_at: string;
  owner_detail?: { id: string; email: string; full_name: string };
}

export interface AdminPrintersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminPrinter[];
}

export interface AdminPrintersFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  country?: string;
  kyc_status?: string;
}

export function useAdminPrinters(filters: AdminPrintersFilters = {}) {
  return useQuery<AdminPrintersResponse>({
    queryKey: ["admin-printers", filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get(endpoints.printers.profileList, { params: filters });
      if (Array.isArray(data)) {
        return { count: data.length, next: null, previous: null, results: data };
      }
      return data;
    },
  });
}

export function useUpdatePrinterStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AdminPrinter["status"] }) => {
      const { data } = await api.patch(`/printers/profile/${id}/`, { status });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-printers"] }),
  });
}
