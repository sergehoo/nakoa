import Link from "next/link";
import { CloudOff, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NakoaLogo } from "@/components/brand/nakoa-logo";

export const metadata = {
  title: "Hors connexion",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-500/5 via-background to-orange-500/5 p-6">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <NakoaLogo variant="icon-bg" size={64} className="mx-auto" />

        <div className="space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/50">
            <CloudOff className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Pas de connexion
          </h1>
          <p className="text-sm text-muted-foreground">
            Nakoa fonctionne en hors-ligne pour les pages déjà visitées. Reconnecte-toi
            pour accéder aux dernières données.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">
              <RotateCcw className="mr-1.5 h-4 w-4" /> Réessayer
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/orders">Mes commandes</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Si le problème persiste, vérifie ta connexion mobile/wifi.
        </p>
      </div>
    </div>
  );
}
