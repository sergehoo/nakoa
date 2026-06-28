"use client";

import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePushSubscription } from "@/hooks/use-push-subscription";

/**
 * Carte de gestion des notifications push, à inclure dans /account ou /notifications.
 *
 * Gère 4 cas :
 * - non supporté        → message explicatif (notamment iOS < 16.4)
 * - permission default  → bouton "Activer"
 * - permission granted  → état + bouton "Envoyer un test" + "Désactiver"
 * - permission denied   → instructions pour réautoriser
 */
export function PushNotificationCard() {
  const { supported, permission, subscribed, loading, error, enable, disable, test } =
    usePushSubscription();

  const onEnable = async () => {
    const ok = await enable();
    if (ok) toast.success("Notifications push activées 🔔");
    else if (error) toast.error("Activation impossible", { description: error });
  };

  const onDisable = async () => {
    const ok = await disable();
    if (ok) toast.success("Notifications push désactivées");
  };

  const onTest = async () => {
    try {
      const res = await test();
      if (res.delivered === 0) {
        toast.message("Aucun appareil n'a reçu le test", {
          description: "Vérifie l'abonnement de cet appareil.",
        });
      } else {
        toast.success(`Test envoyé à ${res.delivered} appareil(s)`);
      }
    } catch {
      toast.error("Échec de l'envoi du test");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-pink-500" />
          Notifications push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!supported ? (
          <div className="rounded-md border border-dashed bg-secondary/30 p-4 text-sm">
            <p className="font-semibold">Non disponible sur cet appareil.</p>
            <p className="mt-1 text-muted-foreground">
              Sur iPhone/iPad, installe d'abord Nakoa sur l'écran d'accueil (iOS 16.4+ requis).
              Sur ordinateur, utilise Chrome, Edge ou Firefox.
            </p>
          </div>
        ) : permission === "denied" ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-semibold text-destructive">Permission bloquée</p>
            <p className="mt-1 text-muted-foreground">
              Tu as refusé les notifications. Réactive-les depuis les paramètres du navigateur,
              puis recharge la page.
            </p>
          </div>
        ) : !subscribed ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Reçois en temps réel les notifications importantes :
              nouvelles commandes, validation BAT, paiements, livraisons.
            </p>
            <Button onClick={onEnable} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bell className="mr-2 h-4 w-4" />
              )}
              Activer les notifications
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-600">Activées</Badge>
              <span className="text-sm text-muted-foreground">
                Tu reçois les notifications Nakoa sur cet appareil.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onTest} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bell className="mr-2 h-3.5 w-3.5" />
                )}
                Envoyer un test
              </Button>
              <Button variant="ghost" size="sm" onClick={onDisable} disabled={loading}>
                <BellOff className="mr-2 h-3.5 w-3.5" />
                Désactiver
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
