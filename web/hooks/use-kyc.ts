"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

export type KYCStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "needs_info";
export type KYCType = "customer" | "business";

export interface KYCSubmission {
  id: string;
  type: KYCType;
  status: KYCStatus;
  submitted_at: string | null;
  decided_at: string | null;
  decision_note: string;
  metadata: Record<string, unknown>;
  documents: KYCDocument[];
  user_detail?: { id: string; email: string; full_name: string };
  created_at: string;
}

export interface KYCDocument {
  id: string;
  submission: string;
  kind: "id_card" | "selfie" | "rccm" | "tax_cert" | "bank_rib" | "proof_address" | "workshop_photo" | "other";
  file: string;
  extracted_data: Record<string, unknown>;
  is_validated: boolean;
  notes: string;
  created_at: string;
}

export function useKycSubmissions(params?: { status?: KYCStatus; type?: KYCType; user?: string }) {
  return useQuery<{ results: KYCSubmission[]; count: number } | KYCSubmission[]>({
    queryKey: ["kyc-submissions", params],
    queryFn: async () => {
      const { data } = await api.get(endpoints.kyc.submissions, { params });
      return data;
    },
  });
}

export function useKycSubmission(id: string | undefined) {
  return useQuery<KYCSubmission>({
    queryKey: ["kyc-submission", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get(endpoints.kyc.submissionDetail(id!));
      return data;
    },
  });
}

export function useCreateKycSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { type: KYCType }) => {
      const { data } = await api.post<KYCSubmission>(endpoints.kyc.submissions, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-submissions"] }),
  });
}

export function useUploadKycDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { submission: string; kind: KYCDocument["kind"]; file: File }) => {
      const form = new FormData();
      form.append("submission", payload.submission);
      form.append("kind", payload.kind);
      form.append("file", payload.file);
      const { data } = await api.post<KYCDocument>(endpoints.kyc.documents, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["kyc-submission", vars.submission] });
      qc.invalidateQueries({ queryKey: ["kyc-submissions"] });
    },
  });
}

export function useDeleteKycDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(endpoints.kyc.documentDetail(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kyc-submission"] });
      qc.invalidateQueries({ queryKey: ["kyc-submissions"] });
    },
  });
}

export function useSubmitKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(endpoints.kyc.submit(id));
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-submissions"] }),
  });
}

// Actions admin
export function useApproveKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { data } = await api.post(endpoints.kyc.approve(id), { note });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-submissions"] }),
  });
}

export function useRejectKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { data } = await api.post(endpoints.kyc.reject(id), { note });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-submissions"] }),
  });
}

export function useRequestKycInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const { data } = await api.post(endpoints.kyc.needsInfo(id), { note });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kyc-submissions"] }),
  });
}
