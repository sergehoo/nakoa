"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/api/types";

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  primary_role: Role;
  kyc_level: number;
  two_factor_enabled: boolean;
}

interface AuthState {
  access: string | null;
  refresh: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string, user: AuthUser) => void;
  setAccess: (access: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: null,
      isAuthenticated: false,
      setTokens: (access, refresh, user) =>
        set({ access, refresh, user, isAuthenticated: true }),
      setAccess: (access) => set({ access }),
      setUser: (user) => set({ user }),
      logout: () => set({ access: null, refresh: null, user: null, isAuthenticated: false }),
    }),
    { name: "printhub-auth" },
  ),
);
