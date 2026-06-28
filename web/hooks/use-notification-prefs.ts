"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

export type Channel = "in_app" | "email" | "sms" | "push" | "whatsapp";

export type NotificationTypePref = {
  type_id: string;
  code: string;
  label: string;
  description: string;
  icon: string;
  category: "transactional" | "marketing" | "system" | "security";
  is_user_toggleable: boolean;
  default_channels: Channel[];
  channels: Channel[];
  is_overridden: boolean;
};

export type AdminNotificationType = {
  id: string;
  code: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  category_label: string;
  default_channels: Channel[];
  is_active: boolean;
  is_user_toggleable: boolean;
  sort_order: number;
};

type PaginatedOrList<T> = T[] | { results: T[]; count: number };
const unwrap = <T,>(p: PaginatedOrList<T>): T[] => (Array.isArray(p) ? p : p.results);

// ============================================================
// Customer — mes préférences
// ============================================================
export function useMyNotificationPreferences() {
  return useQuery<NotificationTypePref[]>({
    queryKey: ["notif_prefs", "me"],
    queryFn: async () => {
      const { data } = await api.get<NotificationTypePref[]>(endpoints.notifPrefs.me);
      return data;
    },
  });
}

export function useUpdateMyPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { type_code: string; channels: Channel[] }) => {
      const { data } = await api.patch(endpoints.notifPrefs.me, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif_prefs", "me"] }),
  });
}

// ============================================================
// Super Admin — CRUD types
// ============================================================
export function useAdminNotificationTypes() {
  return useQuery<AdminNotificationType[]>({
    queryKey: ["notif_prefs", "admin", "types"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedOrList<AdminNotificationType>>(
        endpoints.notifPrefs.types,
      );
      return unwrap(data);
    },
  });
}

export function useUpdateNotificationType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AdminNotificationType> & { id: string }) => {
      const { data } = await api.patch<AdminNotificationType>(
        endpoints.notifPrefs.typeDetail(id), payload,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif_prefs"] }),
  });
}
