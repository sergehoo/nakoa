"use client";

import { useEffect } from "react";

/**
 * Enregistre /sw.js au montage du layout racine.
 *
 * - Ne s'enregistre qu'en production OU si NEXT_PUBLIC_ENABLE_PWA=1 en dev.
 * - Écoute l'événement updatefound pour proposer un rechargement quand
 *   une nouvelle version du SW est dispo.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const enable =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_ENABLE_PWA === "1";
    if (!enable) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // Détecte une nouvelle version du SW
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Nouvelle version prête — on l'active silencieusement.
              newWorker.postMessage("SKIP_WAITING");
            }
          });
        });

        // Recharge la page quand le nouveau SW prend le contrôle.
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      } catch (err) {
        console.warn("[SW] register failed", err);
      }
    };

    // Différé pour ne pas bloquer le first paint
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
