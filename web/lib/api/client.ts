"use client";

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(refresh: string): Promise<string | null> {
  try {
    const { data } = await axios.post(`${BASE_URL}/api/v1/auth/token/refresh/`, { refresh });
    return data?.access ?? null;
  } catch {
    return null;
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const access = useAuthStore.getState().access;
  if (access && config.headers) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      const refresh = useAuthStore.getState().refresh;
      if (!refresh) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken(refresh);
      const newAccess = await refreshing;
      refreshing = null;
      if (newAccess) {
        useAuthStore.getState().setAccess(newAccess);
        if (original.headers) {
          (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
        }
        return api(original);
      }
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

// Endpoints typés (sélection — d'autres seront ajoutés au fur et à mesure)
export const endpoints = {
  auth: {
    register: "/auth/register/",
    login: "/auth/login/",
    refresh: "/auth/token/refresh/",
    logout: "/auth/logout/",
    otpRequest: "/auth/otp/request/",
    otpVerify: "/auth/otp/verify/",
    passwordResetRequest: "/auth/password-reset/request/",
    passwordResetConfirm: "/auth/password-reset/confirm/",
    twoFASetup: "/auth/2fa/setup/",
    twoFAConfirm: "/auth/2fa/confirm/",
    twoFADisable: "/auth/2fa/disable/",
  },
  me: "/accounts/me/",
  accounts: {
    addresses: "/accounts/addresses/",
    addressDetail: (id: string) => `/accounts/addresses/${id}/`,
    addressDefault: (id: string) => `/accounts/addresses/${id}/set-default/`,
    paymentMethods: "/accounts/payment-methods/",
    paymentMethodDetail: (id: string) => `/accounts/payment-methods/${id}/`,
    paymentMethodDefault: (id: string) => `/accounts/payment-methods/${id}/set-default/`,
  },
  catalog: {
    categories: "/catalog/categories/",
    products: "/catalog/products/",
    productBySlug: (slug: string) => `/catalog/products/${slug}/`,
  },
  quotes: {
    list: "/quote-requests/",
    create: "/quote-requests/",
    detail: (id: string) => `/quote-requests/${id}/`,
    submit: (id: string) => `/quote-requests/${id}/submit/`,
    selectOffer: (id: string) => `/quote-requests/${id}/select-offer/`,
    convert: (id: string) => `/quote-requests/${id}/convert/`,
  },
  orders: {
    list: "/orders/",
    detail: (id: string) => `/orders/${id}/`,
    accept: (id: string) => `/orders/${id}/accept/`,
    startProduction: (id: string) => `/orders/${id}/start-production/`,
    qualityCheck: (id: string) => `/orders/${id}/quality-check/`,
    readyPickup: (id: string) => `/orders/${id}/ready-pickup/`,
    startDelivery: (id: string) => `/orders/${id}/start-delivery/`,
    deliver: (id: string) => `/orders/${id}/deliver/`,
    complete: (id: string) => `/orders/${id}/complete/`,
    cancel: (id: string) => `/orders/${id}/cancel/`,
    dispute: (id: string) => `/orders/${id}/dispute/`,
  },
  production: {
    jobs: "/production/jobs/",
    steps: "/production/steps/",
    incidents: "/production/incidents/",
  },
  payments: {
    initiate: "/payments/initiate/",
    list: "/payments/",
    wallet: "/payments/wallet/",
  },
  printers: {
    directory: "/printers/directory/",
    nearby: "/printers/directory/nearby/",
    profile: "/printers/profile/me/",
    profileList: "/printers/profile/",
    machines: "/printers/machines/",
    machineDetail: (id: string) => `/printers/machines/${id}/`,
    finishes: "/printers/finishes/",
    deliveryZones: "/printers/delivery-zones/",
    deliveryZoneDetail: (id: string) => `/printers/delivery-zones/${id}/`,
    members: "/printers/members/",
    memberDetail: (id: string) => `/printers/members/${id}/`,
    // Catalogue imprimeur (PrinterProduct)
    printerProducts: "/printers/printer-products/",
    printerProductDetail: (id: string) => `/printers/printer-products/${id}/`,
    printerProductAvailable: "/printers/printer-products/available/",
    printerProductBulkActivate: "/printers/printer-products/bulk-activate/",
    productOfferings: "/printers/product-offerings/",
  },
  pricing: {
    grids: "/pricing/grids/",
    gridDetail: (id: string) => `/pricing/grids/${id}/`,
    tiers: "/pricing/tiers/",
    tierDetail: (id: string) => `/pricing/tiers/${id}/`,
    modifiers: "/pricing/modifiers/",
    promos: "/pricing/promos/",
  },
  dashboards: {
    customer: "/dashboards/customer/",
    printer: "/dashboards/printer/",
    admin: "/dashboards/admin/",
  },
  notifications: {
    list: "/notifications/",
    unreadCount: "/notifications/unread-count/",
    markRead: (id: string) => `/notifications/${id}/mark-read/`,
    readAll: "/notifications/read-all/",
  },
  assistant: {
    conversations: "/assistant/conversations/",
    send: (id: string) => `/assistant/conversations/${id}/send/`,
  },
  ai: {
    batAnalyses: "/ai/bat-analyses/",
    runBatAnalysis: "/ai/bat-analyses/run/",
  },
  kyc: {
    submissions: "/kyc/submissions/",
    submissionDetail: (id: string) => `/kyc/submissions/${id}/`,
    submit: (id: string) => `/kyc/submissions/${id}/submit/`,
    approve: (id: string) => `/kyc/submissions/${id}/approve/`,
    reject: (id: string) => `/kyc/submissions/${id}/reject/`,
    needsInfo: (id: string) => `/kyc/submissions/${id}/needs-info/`,
    documents: "/kyc/documents/",
    documentDetail: (id: string) => `/kyc/documents/${id}/`,
  },
  admin: {
    users: "/accounts/admin/users/",
    userDetail: (id: string) => `/accounts/admin/users/${id}/`,
    userSuspend: (id: string) => `/accounts/admin/users/${id}/suspend/`,
    userActivate: (id: string) => `/accounts/admin/users/${id}/activate/`,
  },
};

export type ApiClient = typeof api;
