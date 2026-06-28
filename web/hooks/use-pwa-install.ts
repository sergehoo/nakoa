"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Capture l'événement `beforeinstallprompt` (Chromium) et expose une API
 * unifiée pour Android/Desktop. Pour iOS Safari, on retourne `canPrompt=false`
 * mais `isIOS=true` pour que l'UI puisse afficher des instructions ad hoc
 * ("Partager → Ajouter à l'écran d'accueil").
 */

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type Platform = "android" | "ios" | "desktop" | "unknown";

const DISMISS_KEY = "nakoa.pwa.install.dismissedAt";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/windows|macintosh|linux/i.test(ua)) return "desktop";
  return "unknown";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS spécifique
  // @ts-expect-error — propriété non-standard iOS
  if (window.navigator.standalone) return true;
  return false;
}

function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    return Number.isFinite(at) && Date.now() - at < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const prompt = useCallback(async () => {
    if (!deferredPrompt) return { outcome: "dismissed" as const };
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return result;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setDeferredPrompt(null);
  }, []);

  const canPrompt = !!deferredPrompt && !installed && !wasRecentlyDismissed();
  const showIosHint = platform === "ios" && !installed && !wasRecentlyDismissed();

  return {
    canPrompt,
    showIosHint,
    platform,
    installed,
    prompt,
    dismiss,
  };
}
