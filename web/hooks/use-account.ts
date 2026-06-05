"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

// ============================================================
// Adresses
// ============================================================
export interface UserAddress {
  id: string;
  kind: "shipping" | "billing" | "pickup";
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  landmark: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressInput {
  kind: "shipping" | "billing" | "pickup";
  label?: string;
  full_name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postal_code?: string;
  country: string;
  landmark?: string;
  is_default?: boolean;
}

export function useAddresses() {
  return useQuery<{ results: UserAddress[] } | UserAddress[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.accounts.addresses);
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddressInput) => {
      const { data } = await api.post<UserAddress>(endpoints.accounts.addresses, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<AddressInput> }) => {
      const { data } = await api.patch<UserAddress>(endpoints.accounts.addressDetail(id), payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(endpoints.accounts.addressDetail(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(endpoints.accounts.addressDefault(id));
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

// ============================================================
// Méthodes de paiement
// ============================================================
export interface PaymentMethod {
  id: string;
  kind: "wave" | "orange_money" | "mtn_momo" | "moov" | "card_stripe" | "bank_transfer";
  label: string;
  phone_number: string | null;
  masked_account: string | null;
  card_brand: string | null;
  card_last4: string | null;
  is_default: boolean;
  created_at: string;
}

export interface PaymentMethodInput {
  kind: PaymentMethod["kind"];
  label?: string;
  phone_number?: string;
  is_default?: boolean;
}

export function usePaymentMethods() {
  return useQuery<{ results: PaymentMethod[] } | PaymentMethod[]>({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.accounts.paymentMethods);
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
  });
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PaymentMethodInput) => {
      const { data } = await api.post<PaymentMethod>(endpoints.accounts.paymentMethods, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(endpoints.accounts.paymentMethodDetail(id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(endpoints.accounts.paymentMethodDefault(id));
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
}
