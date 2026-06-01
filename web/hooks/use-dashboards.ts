"use client";

import { useQuery } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";
import type { DashboardAdmin, DashboardCustomer, DashboardPrinter } from "@/lib/api/types";

export function useCustomerDashboard() {
  return useQuery<DashboardCustomer>({
    queryKey: ["dashboard", "customer"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.dashboards.customer);
      return data;
    },
  });
}

export function usePrinterDashboard() {
  return useQuery<DashboardPrinter>({
    queryKey: ["dashboard", "printer"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.dashboards.printer);
      return data;
    },
  });
}

export function useAdminDashboard() {
  return useQuery<DashboardAdmin>({
    queryKey: ["dashboard", "admin"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.dashboards.admin);
      return data;
    },
  });
}
