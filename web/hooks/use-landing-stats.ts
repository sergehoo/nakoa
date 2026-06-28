"use client";

import { useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

export type LandingStats = {
  active_printers: number;
  products: number;
  orders_completed: number;
  cities_covered: number;
};

const FALLBACK_STATS: LandingStats = {
  active_printers: 0,
  products: 0,
  orders_completed: 0,
  cities_covered: 0,
};

/**
 * Récupère les statistiques publiques pour la landing page.
 * Endpoint : GET /api/v1/analytics/public/stats/ — non authentifié, mis en cache 60s côté backend.
 *
 * On refetch toutes les 5 minutes côté client pour avoir une valeur "fraîche".
 * Si l'API échoue (offline, backend down), on tombe sur des valeurs à 0 plutôt
 * que de casser la landing.
 */
export function useLandingStats() {
  return useQuery<LandingStats>({
    queryKey: ["public", "landing-stats"],
    queryFn: async () => {
      try {
        const { data } = await api.get<LandingStats>(endpoints.public.landingStats);
        return { ...FALLBACK_STATS, ...data };
      } catch {
        return FALLBACK_STATS;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
