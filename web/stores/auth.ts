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

// Cookie miroir lu par le middleware Next.js (qui n'a pas accès au localStorage).
// Le contenu n'a pas besoin d'être sécurisé : c'est juste un flag « authentifié ».
const AUTH_COOKIE = "printhub-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours, aligné sur le refresh token

function setAuthCookie(value: string | null) {
  if (typeof document === "undefined") return;
  if (value) {
    // path=/ pour qu'il soit visible partout, SameSite=Lax pour la nav classique.
    // Pas de Secure en dev (http localhost), mais en prod le navigateur passera en HTTPS.
    document.cookie = `${AUTH_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  } else {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: null,
      isAuthenticated: false,
      setTokens: (access, refresh, user) => {
        setAuthCookie(user.primary_role || "1");
        set({ access, refresh, user, isAuthenticated: true });
      },
      setAccess: (access) => set({ access }),
      setUser: (user) => {
        // Garde le cookie en vie quand on rafraîchit le profil
        if (user) setAuthCookie(user.primary_role || "1");
        set({ user });
      },
      logout: () => {
        setAuthCookie(null);
        set({ access: null, refresh: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: "printhub-auth",
      // Au rehydrate (rechargement de la page), on remet le cookie en place si l'utilisateur
      // est encore "authentifié" côté localStorage — ça évite que le middleware le déconnecte
      // après un simple refresh.
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated && state.user) {
          setAuthCookie(state.user.primary_role || "1");
        }
      },
    },
  ),
);
