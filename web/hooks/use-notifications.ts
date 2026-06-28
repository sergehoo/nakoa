"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

export interface Notification {
  id: string;
  kind: string;
  channel: string;
  subject: string;
  body: string;
  is_read: boolean;
  link: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

export interface NotificationsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

export function useNotifications(filters: { page?: number; is_read?: boolean; kind?: string } = {}) {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications-page", filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get(endpoints.notifications.list, {
        params: { page_size: 25, ordering: "-created_at", ...filters },
      });
      if (Array.isArray(data)) {
        return { count: data.length, next: null, previous: null, results: data };
      }
      return data;
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(endpoints.notifications.markRead(id));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-page"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(endpoints.notifications.readAll);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-page"] });
    },
  });
}
