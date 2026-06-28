"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

export interface Review {
  id: string;
  order: string;
  customer: string;
  customer_name?: string;
  customer_initials?: string;
  printer: string;
  overall_rating: number;
  quality_rating: number;
  delivery_rating: number;
  communication_rating: number;
  title: string;
  body: string;
  photos: string[];
  is_verified: boolean;
  status: "draft" | "published" | "hidden";
  printer_response: string;
  printer_response_at: string | null;
  created_at: string;
}

export interface ReviewInput {
  order: string;
  overall_rating: number;
  quality_rating: number;
  delivery_rating: number;
  communication_rating: number;
  title?: string;
  body?: string;
}

export function useReviews(params?: { printer?: string; customer?: string }) {
  return useQuery<{ results: Review[] } | Review[]>({
    queryKey: ["reviews", params],
    queryFn: async () => {
      const { data } = await api.get(endpoints.reviews.list, { params });
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
  });
}

export function useOrderReview(orderId: string | undefined) {
  return useQuery<Review | null>({
    queryKey: ["order-review", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data } = await api.get(endpoints.reviews.list, {
        params: { order: orderId },
      });
      const items = Array.isArray(data) ? data : data.results ?? [];
      return items[0] ?? null;
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReviewInput) => {
      const { data } = await api.post<Review>(endpoints.reviews.list, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useRespondReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { data } = await api.post<Review>(endpoints.reviews.respond(id), {
        response,
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}
