"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

// ============================================================
// Profil imprimeur (KYB)
// ============================================================
export interface PrinterProfile {
  id: string;
  legal_name: string;
  trade_name: string;
  rccm: string;
  tax_id: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  founded_year: number | null;
  staff_count: number | null;
  kyc_status: "pending" | "submitted" | "approved" | "rejected";
  quality_score: number;
  on_time_rate: number;
  capacity_per_day: number;
  current_load_pct: number;
  geo_lat: number | null;
  geo_lng: number | null;
}

export function usePrinterProfile() {
  return useQuery<PrinterProfile>({
    queryKey: ["printer-profile-me"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.printers.profile);
      return data;
    },
    retry: false,
  });
}

export function useUpdatePrinterProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PrinterProfile>) => {
      const { data } = await api.patch<PrinterProfile>(endpoints.printers.profile, payload);
      return data;
    },
    onSuccess: (data) => qc.setQueryData(["printer-profile-me"], data),
  });
}

// ============================================================
// Machines
// ============================================================
export interface Machine {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  max_format: string;
  is_color: boolean;
  is_active: boolean;
  capacity_per_hour: number;
  notes: string;
}

export function useMachines() {
  return useQuery<{ results: Machine[] } | Machine[]>({
    queryKey: ["printer-machines"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.printers.machines);
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
  });
}

export function useSaveMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<Machine> }) => {
      if (id) {
        const { data } = await api.patch(endpoints.printers.machineDetail(id), payload);
        return data;
      }
      const { data } = await api.post(endpoints.printers.machines, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["printer-machines"] }),
  });
}

export function useDeleteMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.printers.machineDetail(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["printer-machines"] }),
  });
}

// ============================================================
// Zones de livraison
// ============================================================
export interface DeliveryZone {
  id: string;
  name: string;
  country: string;
  city: string;
  postal_codes: string[];
  radius_km: number | null;
  delivery_fee: string;
  estimated_days: number;
  is_active: boolean;
}

export function useDeliveryZones() {
  return useQuery<{ results: DeliveryZone[] } | DeliveryZone[]>({
    queryKey: ["printer-zones"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.printers.deliveryZones);
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
  });
}

export function useSaveDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<DeliveryZone> }) => {
      if (id) {
        const { data } = await api.patch(endpoints.printers.deliveryZoneDetail(id), payload);
        return data;
      }
      const { data } = await api.post(endpoints.printers.deliveryZones, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["printer-zones"] }),
  });
}

export function useDeleteDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.printers.deliveryZoneDetail(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["printer-zones"] }),
  });
}

// ============================================================
// Membres de l'imprimerie
// ============================================================
export interface PrinterMember {
  id: string;
  user: string; // user id
  email: string;
  full_name: string;
  role: "owner" | "manager" | "operator" | "accountant" | "viewer";
  is_active: boolean;
  invited_at: string | null;
  joined_at: string | null;
}

export function useMembers() {
  return useQuery<{ results: PrinterMember[] } | PrinterMember[]>({
    queryKey: ["printer-members"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.printers.members);
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; role: PrinterMember["role"] }) => {
      const { data } = await api.post(endpoints.printers.members, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["printer-members"] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<PrinterMember> }) => {
      const { data } = await api.patch(endpoints.printers.memberDetail(id), payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["printer-members"] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.printers.memberDetail(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["printer-members"] }),
  });
}

// ============================================================
// Grilles tarifaires
// ============================================================
export interface PriceGrid {
  id: string;
  product: string;
  product_detail?: { id: string; name: string; slug: string };
  currency: string;
  base_setup_cost: string;
  base_unit_cost: string;
  vat_rate: string;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  tiers?: PriceTier[];
}

export interface PriceTier {
  id: string;
  grid: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: string;
  discount_pct: string;
}

export function usePriceGrids() {
  return useQuery<{ results: PriceGrid[] } | PriceGrid[]>({
    queryKey: ["price-grids"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.pricing.grids);
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
  });
}

export function useSavePriceGrid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<PriceGrid> }) => {
      if (id) {
        const { data } = await api.patch(endpoints.pricing.gridDetail(id), payload);
        return data;
      }
      const { data } = await api.post(endpoints.pricing.grids, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price-grids"] }),
  });
}

export function useDeletePriceGrid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.pricing.gridDetail(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price-grids"] }),
  });
}

export function useSavePriceTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: Partial<PriceTier> }) => {
      if (id) {
        const { data } = await api.patch(endpoints.pricing.tierDetail(id), payload);
        return data;
      }
      const { data } = await api.post(endpoints.pricing.tiers, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price-grids"] }),
  });
}

export function useDeletePriceTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.pricing.tierDetail(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price-grids"] }),
  });
}
