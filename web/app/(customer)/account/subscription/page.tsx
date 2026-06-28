"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useCancelSubscription,
  useMySubscription,
  usePlans,
  useSubscribe,
  type Plan,
} from "@/hooks/use-subscriptions";
import { formatCurrency } from "@/lib/utils";

function SubscriptionPage() {
  const router = useRouter();
  const search = useSearchParams();
  const planCode = search.get("plan");
  const cycle = (search.get("cycle") as "monthly" | "yearly") || "monthly";

  const { data: current, isLoading } = useMySubscription();
  const { data: plans } = usePlans();
  const subscribe = useSubscribe();
  const cancel = useCancelSubscription();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  // Souscrit automatiquement quand on arrive avec ?plan=...
  useEffect(() => {
    if (!planCode || isLoading || subscribe.isPending) return;
    if (current?.active && current?.plan_detail?.code === planCode) return;

    (async () => {
      try {
        const res = await subscribe.mutateAsync({
          plan: planCode,
          cycle,
          start_trial: true,
        });
        if (res.payment_required) {
          toast.message("Paiement requis", {
            description: `Montant : ${formatCurrency(Number(res.amount))} ${res.currency}`,
          });
        } else {
          toast.success(
            res.subscription.status === "trial"
              ? "Essai gratuit démarré 🎉"
              : "Abonnement activé ✨",
          );
        }
        // Nettoie l'URL pour éviter les re-souscriptions à chaque visite
        router.replace("/account/subscription");
      } catch (e: unknown) {
        const err = e as { response?: { data?: { detail?: string } } };
        toast.error("Souscription impossible", {
          description: err?.response?.data?.detail ?? "Réessayez plus tard.",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planCode]);

  const onCancel = async () => {
    try {
      await cancel.mutateAsync({ reason });
      toast.success("Abonnement annulé.");
      setCancelOpen(false);
      setReason("");
    } catch {
      toast.error("Échec de l'annulation");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Mon abonnement
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérer mon plan, mes paiements et mes quotas Nakoa.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pricing">Voir tous les plans</Link>
        </Button>
      </div>

      {current?.active && current.plan_detail ? (
        <CurrentSubscriptionCard
          current={current as { plan_detail: Plan; status: string; cycle: string; current_period_end: string; trial_ends_at: string | null }}
          onCancel={() => setCancelOpen(true)}
        />
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-orange-500" />
            <h2 className="mt-3 font-display text-xl font-semibold">
              Aucun abonnement actif
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choisis un plan pour débloquer les fonctionnalités premium Nakoa.
            </p>
            <Button asChild className="mt-4">
              <Link href="/pricing">Découvrir les plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans disponibles (upsell/downgrade) */}
      {plans && plans.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Changer de plan
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {plans
              .filter((p) => p.is_public && p.is_active)
              .filter((p) => p.code !== current?.plan_detail?.code)
              .slice(0, 6)
              .map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="space-y-3 p-5">
                    <div>
                      <p className="font-display text-lg font-semibold">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                    </div>
                    <p className="text-2xl font-bold">
                      {Number(plan.monthly_price) > 0
                        ? `${formatCurrency(Number(plan.monthly_price))}/mois`
                        : "Sur devis"}
                    </p>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <Link href={`/account/subscription?plan=${plan.code}&cycle=monthly`}>
                        Souscrire
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Dialog annulation */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler mon abonnement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tu pourras continuer à utiliser ton plan jusqu'à la fin de la période en cours.
              Aide-nous à nous améliorer en partageant une raison.
            </p>
            <Textarea
              placeholder="Pourquoi annules-tu ? (optionnel)"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Garder mon abonnement
            </Button>
            <Button
              variant="destructive"
              onClick={onCancel}
              disabled={cancel.isPending}
            >
              {cancel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CurrentSubscriptionCard({
  current,
  onCancel,
}: {
  current: { plan_detail: Plan; status: string; cycle: string; current_period_end: string; trial_ends_at: string | null };
  onCancel: () => void;
}) {
  const { plan_detail: plan, status, cycle, current_period_end, trial_ends_at } = current;
  const isTrial = status === "trial";

  return (
    <Card className="overflow-hidden border-pink-500/30">
      <div className="bg-gradient-to-r from-pink-500/10 via-violet-500/5 to-orange-500/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" />
              <h2 className="font-display text-2xl font-bold tracking-tight">
                {plan.name}
              </h2>
              <Badge
                className={
                  status === "active"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : status === "trial"
                      ? "bg-orange-500/15 text-orange-600"
                      : ""
                }
              >
                {status === "active" ? "Active" : status === "trial" ? "Essai" : status}
              </Badge>
            </div>
            {plan.tagline && (
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold">
              {Number(cycle === "yearly" ? plan.yearly_price : plan.monthly_price) > 0
                ? formatCurrency(
                  Number(cycle === "yearly" ? plan.yearly_price : plan.monthly_price),
                )
                : "Gratuit"}
            </p>
            <p className="text-xs text-muted-foreground">
              {cycle === "yearly" ? "par an" : "par mois"}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-md border bg-secondary/30 p-3 text-sm">
            <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {isTrial && trial_ends_at ? "Fin de l'essai" : "Prochaine échéance"}
              </p>
              <p className="text-muted-foreground">
                {new Date(current_period_end).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="rounded-md border bg-secondary/30 p-3 text-sm">
            <p className="font-medium">Commission marketplace</p>
            <p className="text-muted-foreground">{plan.commission_pct}% par commande</p>
          </div>
        </div>

        {plan.features.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Inclus dans ton plan
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2 text-sm">
              {plan.features.slice(0, 10).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>{f.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" asChild>
            <Link href="/pricing">Changer de plan</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-destructive hover:text-destructive"
          >
            <X className="mr-1.5 h-4 w-4" /> Annuler l'abonnement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<SubscriptionFallback />}>
      <SubscriptionPage />
    </Suspense>
  );
}
