"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useAdminUsers(filters?: { role?: string; country?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin-users", filters],
    queryFn: async () => {
      const { data } = await api.get("/accounts/users/", { params: filters });
      return data;
    },
  });
}

export function useAdminPrinters(filters?: { status?: string; country?: string }) {
  return useQuery({
    queryKey: ["admin-printers", filters],
    queryFn: async () => {
      const { data } = await api.get("/printers/directory/", { params: filters });
      return data;
    },
  });
}

export function useKycSubmissions() {
  return useQuery({
    queryKey: ["kyc-submissions"],
    queryFn: async () => {
      const { data } = await api.get("/kyc/submissions/");
      return data;
    },
  });
}

export function useKycApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { data } = await api.post(`/kyc/submissions/${id}/approve/`, { note });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-submissions"] }),
  });
}

export function useKycReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { data } = await api.post(`/kyc/submissions/${id}/reject/`, { note });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-submissions"] }),
  });
}
