"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NakoaLogo } from "@/components/brand/nakoa-logo";
import { usePWAInstall } from "@/hooks/use-pwa-install";

/**
 * Bandeau d'installation discret en bas d'écran.
 *
 * - Android/Desktop : bouton "Installer" qui déclenche `beforeinstallprompt`.
 * - iOS Safari      : tooltip qui explique "Partager → Ajouter à l'écran d'accueil".
 *
 * Caché si l'app est déjà installée ou si l'utilisateur l'a fermé récemment (30 j).
 */
export function PWAInstallPrompt() {
  const { canPrompt, showIosHint, platform, prompt, dismiss } = usePWAInstall();
  const [visible, setVisible] = useState(false);

  // Affichage différé : on attend que l'utilisateur ait un peu interagi
  useEffect(() => {
    if (!canPrompt && !showIosHint) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [canPrompt, showIosHint]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md animate-slide-up">
      <div className="rounded-2xl border bg-background/95 p-4 shadow-2xl shadow-pink-500/10 backdrop-blur">
        <button
          type="button"
          onClick={() => {
            dismiss();
            setVisible(false);
          }}
          aria-label="Fermer"
          className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <NakoaLogo variant="icon-bg" size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Installe Nakoa sur ton écran d'accueil</p>
            <p className="text-xs text-muted-foreground">
              Plus rapide, hors-ligne, notifications push — comme une vraie app.
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {canPrompt && (
            <Button
              size="sm"
              className="flex-1"
              onClick={async () => {
                const res = await prompt();
                if (res.outcome === "accepted") setVisible(false);
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Installer
            </Button>
          )}
          {showIosHint && (
            <div className="flex-1 rounded-md bg-secondary/50 px-3 py-2 text-xs leading-snug">
              <span className="font-semibold">Sur iPhone :</span> appuie sur{" "}
              <Share className="inline h-3 w-3 align-text-bottom" /> puis « Sur l'écran d'accueil ».
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              dismiss();
              setVisible(false);
            }}
          >
            Plus tard
          </Button>
        </div>

        <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          {platform === "ios" ? "iOS · Safari" : platform === "android" ? "Android" : "Desktop"}
        </p>
      </div>
    </div>
  );
}
