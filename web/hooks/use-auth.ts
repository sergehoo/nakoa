"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth";
import type { AuthTokens, User } from "@/lib/api/types";

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; two_factor_code?: string }) => {
      const { data } = await api.post<AuthTokens>(endpoints.auth.login, payload);
      return data;
    },
    onSuccess: (data) => {
      setTokens(data.access, data.refresh, data.user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      primary_role?: string;
      country?: string;
    }) => {
      const { data } = await api.post(endpoints.auth.register, payload);
      return data;
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const refresh = useAuthStore((s) => s.refresh);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (refresh) {
        try {
          await api.post(endpoints.auth.logout, { refresh });
        } catch {}
      }
    },
    onSettled: () => {
      logout();
      qc.clear();
    },
  });
}

export function useOtpRequest() {
  return useMutation({
    mutationFn: async (payload: { identifier: string; purpose: string; channel?: string }) => {
      const { data } = await api.post(endpoints.auth.otpRequest, {
        channel: "sms",
        ...payload,
      });
      return data;
    },
  });
}

export function useOtpVerify() {
  return useMutation({
    mutationFn: async (payload: { identifier: string; code: string; purpose: string }) => {
      const { data } = await api.post(endpoints.auth.otpVerify, payload);
      return data;
    },
  });
}

export function useMe(enabled = true) {
  return useQuery<User>({
    queryKey: ["me"],
    enabled,
    queryFn: async () => {
      const { data } = await api.get<User>(endpoints.me);
      return data;
    },
  });
}

export function useSetup2FA() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ secret: string; provisioning_uri: string; backup_codes: string[] }>(
        endpoints.auth.twoFASetup,
      );
      return data;
    },
  });
}

export function useConfirm2FA() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post(endpoints.auth.twoFAConfirm, { code });
      return data;
    },
  });
}
