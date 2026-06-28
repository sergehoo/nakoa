"use client";

import { useCallback, useEffect, useState } from "react";
import { api, endpoints } from "@/lib/api/client";

/**
 * Hook de gestion des notifications Push Web (VAPID).
 *
 * Cycle :
 * 1. Vérifie le support (Notification API + SW + PushManager)
 * 2. Récupère la clé publique VAPID depuis le backend
 * 3. Demande la permission au navigateur
 * 4. Abonne via PushManager.subscribe(...)
 * 5. POST /notifications/push/subscribe avec endpoint + p256dh + auth
 *
 * Compatible iOS 16.4+ (la PWA doit être installée sur l'écran d'accueil).
 */

type PermissionState = "default" | "granted" | "denied";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  // Utilise un ArrayBuffer dédié (pas SharedArrayBuffer) pour satisfaire applicationServerKey
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function usePushSubscription() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Détection au montage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission as PermissionState);
      // Vérifie l'état d'abonnement actuel
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setSubscribed(!!sub))
        .catch(() => {});
    }
  }, []);

  const enable = useCallback(async () => {
    if (!supported) {
      setError("Notifications non supportées sur cet appareil/navigateur.");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Permission utilisateur
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== "granted") {
        setError(perm === "denied" ? "Permission refusée." : "Permission non accordée.");
        return false;
      }

      // 2. Récupère la clé publique VAPID
      const { data } = await api.get<{ public_key: string }>(endpoints.push.publicKey);
      if (!data.public_key) {
        setError("Push non configuré côté serveur.");
        return false;
      }

      // 3. Abonne via PushManager
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.public_key),
        }));

      // 4. POST au backend
      const sw = sub.toJSON();
      const p256dh = sw.keys?.p256dh ?? arrayBufferToBase64(sub.getKey("p256dh"));
      const auth = sw.keys?.auth ?? arrayBufferToBase64(sub.getKey("auth"));
      await api.post(endpoints.push.subscribe, {
        endpoint: sub.endpoint,
        p256dh,
        auth,
      });
      setSubscribed(true);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const disable = useCallback(async () => {
    if (!supported) return false;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.post(endpoints.push.unsubscribe, { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe();
      }
      setSubscribed(false);
      return true;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const test = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.post<{ delivered: number; subscriptions_total: number }>(
        endpoints.push.test,
        {},
      );
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, permission, subscribed, loading, error, enable, disable, test };
}
