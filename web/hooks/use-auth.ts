"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth";
import type { AuthTokens, User } from "@/lib/api/types";

/**
 * Hook principal d'authentification — wrapper de useAuthStore avec utilities.
 *
 * - `user` : utilisateur courant (depuis store rehydraté)
 * - `isAuthenticated` : tokens présents
 * - `isReady` : true quand l'hydratation du store est terminée (évite flash CTA login)
 * - `dashboardUrl` : URL du dashboard selon le rôle (utilisable dans <Link>)
 * - `logout()` : déconnecte proprement (révoque le refresh token + clear cookies/storage)
 */
export function useAuth() {
  const { user, access, refresh, isAuthenticated, logout: storeLogout } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // Évite le flash "non connecté" pendant la rehydratation Zustand
  useEffect(() => {
    setIsReady(true);
  }, []);

  const role = user?.primary_role ?? null;
  const dashboardUrl = (() => {
    if (!role) return "/dashboard";
    if (role.startsWith("printer") || role === "quality_controller") return "/p/dashboard";
    if (["admin", "super_admin", "support", "accountant"].includes(role)) return "/a/dashboard";
    return "/dashboard";
  })();

  const logout = async () => {
    if (refresh) {
      try {
        await api.post(endpoints.auth.logout, { refresh });
      } catch {
        // ignore — on déconnecte localement de toute façon
      }
    }
    storeLogout();
  };

  return {
    user,
    access,
    isAuthenticated: !!user && isAuthenticated,
    isReady,
    role,
    dashboardUrl,
    logout,
  };
}

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
      const { data } = await api.post<{
        otp_id: string;
        expires_at: string;
        expires_in_seconds: number;
        max_attempts: number;
      }>(endpoints.auth.otpRequest, {
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

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<{
      first_name: string;
      last_name: string;
      phone: string;
      locale: string;
      timezone: string;
      country: string;
      preferred_currency: string;
    }>) => {
      const { data } = await api.patch<User>(endpoints.me, payload);
      return data;
    },
    onSuccess: (data) => {
      qc.setQueryData(["me"], data);
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
