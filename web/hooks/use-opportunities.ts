"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

export interface Opportunity {
  id: string;
  reference: string;
  quantity: number;
  currency: string;
  budget_min: string | null;
  budget_max: string | null;
  desired_delivery_at: string | null;
  delivery_country: string;
  delivery_city: string;
  customer_notes: string;
  status: string;
  created_at: string;
  product_detail: {
    id: string;
    name: string;
    slug: string;
    short_description: string;
    category: string | null;
    lead_time_days: number;
    min_quantity: number;
  };
  customer_initials: string;
}

export function useOpportunities() {
  return useQuery<{ results: Opportunity[] } | Opportunity[]>({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.quotes.opportunities);
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
    refetchInterval: 30_000, // poll toutes les 30s pour les nouvelles opportunités
  });
}

export function useRespondOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      unit_price: number;
      estimated_lead_time_days: number;
      delivery_fee?: number;
      notes?: string;
    }) => {
      const { id, ...body } = payload;
      const { data } = await api.post(endpoints.quotes.opportunityRespond(id), body);
      return data as {
        offer_id: string;
        total_incl_tax: string;
        expected_delivery_at: string | null;
      };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunities"] }),
  });
}

export function useDeclineOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(endpoints.quotes.opportunityDecline(id));
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunities"] }),
  });
}
