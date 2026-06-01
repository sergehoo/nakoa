"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type { Order, Paginated } from "@/lib/api/types";

export function useOrders(params?: { status?: string; page?: number }) {
  return useQuery<Paginated<Order>>({
    queryKey: ["orders", params],
    queryFn: async () => {
      const { data } = await api.get(endpoints.orders.list, { params });
      return data;
    },
  });
}

export function useOrder(id: string | undefined) {
  return useQuery<Order>({
    queryKey: ["order", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(endpoints.orders.detail(id!));
      return data;
    },
  });
}

export function useOrderTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, payload }: { id: string; action: keyof typeof endpoints.orders; payload?: unknown }) => {
      const fn = endpoints.orders[action];
      if (typeof fn !== "function") throw new Error("invalid action");
      const url = (fn as (id: string) => string)(id);
      const { data } = await api.post(url, payload ?? {});
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["order", vars.id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
