"use client";

import { useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

export type ProductPrinterOffer = {
  id: string;
  printer_id: string;
  printer_slug: string;
  printer_name: string;
  printer_city: string;
  printer_country: string;
  printer_is_premium: boolean;
  printer_logo: string | null;
  min_price: string;
  setup_cost: string;
  currency: string;
  standard_lead_time_days: number;
  express_lead_time_days: number;
  is_express_available: boolean;
  daily_capacity: number;
  orders_count: number;
  rating: number;
  reviews_count: number;
  notes: string;
};

export type ProductReview = {
  id: string;
  customer_name: string;
  printer_name: string;
  overall_rating: number;
  quality_rating: number;
  delivery_rating: number;
  communication_rating: number;
  title: string;
  body: string;
  is_verified: boolean;
  created_at: string;
  printer_response: string;
};

export function useProductPrinters(slug: string | undefined) {
  return useQuery<{ count: number; results: ProductPrinterOffer[] }>({
    queryKey: ["product", slug, "printers"],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get(endpoints.catalog.productPrinters(slug!));
      return data;
    },
  });
}

export function useProductReviews(slug: string | undefined) {
  return useQuery<{ average: number; total: number; results: ProductReview[] }>({
    queryKey: ["product", slug, "reviews"],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get(endpoints.catalog.productReviews(slug!));
      return data;
    },
  });
}
