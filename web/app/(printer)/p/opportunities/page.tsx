"use client";

import { useState } from "react";
import {
  Boxes, Calendar, CheckCircle2, Clock, DollarSign, Flame, Loader2,
  MapPin, MessageSquare, Package, Sparkles, TrendingUp, X,
} from "lucide-react";
import { toast } from "sonner";

import {
  useOpportunities, useRespondOpportunity, useDeclineOpportunity,
  type Opportunity,
} from "@/hooks/use-opportunities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency, formatDateTime } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function RespondDialog({ opportunity }: { opportunity: Opportunity }) {
  const [open, setOpen] = useState(false);
  const [unitPrice, setUnitPrice] = useState(0);
  const [leadTime, setLeadTime] = useState(opportunity.product_detail.lead_time_days || 5);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [notes, setNotes] = useState("");

  const respond = useRespondOpportunity();

  const total = unitPrice * opportunity.quantity;
  const totalTtc = total * 1.18 + Number(deliveryFee || 0);

  const submit = async () => {
    if (unitPrice <= 0) {
      toast.error("Indiquez un prix unitaire");
      return;
    }
    try {
      const res = await respond.mutateAsync({
        id: opportunity.id,
        unit_price: unitPrice,
        estimated_lead_time_days: leadTime,
        delivery_fee: Number(deliveryFee) || 0,
        notes,
      });
      toast.success("Offre envoyée au client", {
        description: `Total TTC : ${res.total_incl_tax} ${opportunity.currency}`,
      });
      setOpen(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error("Échec de l'envoi", {
        description: err?.response?.data?.detail ?? "Réessayez",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Sparkles className="mr-2 h-3.5 w-3.5" /> Proposer une offre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Répondre à l&apos;opportunité</DialogTitle>
          <DialogDescription>
            <strong>{opportunity.quantity}× {opportunity.product_detail.name}</strong>
            {opportunity.delivery_city && <> · livraison {opportunity.delivery_city}</>}.
            Votre offre sera envoyée au client en temps réel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Détails demande */}
          <div className="rounded-lg border bg-secondary/30 p-3 text-sm">
            <p className="font-semibold">{opportunity.product_detail.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {opportunity.product_detail.short_description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">Quantité : {opportunity.quantity}</Badge>
              {opportunity.budget_max && (
                <Badge variant="secondary">
                  Budget max : {formatCurrency(Number(opportunity.budget_max), opportunity.currency)}
                </Badge>
              )}
              {opportunity.desired_delivery_at && (
                <Badge variant="warning" className="gap-1">
                  <Calendar className="h-3 w-3" /> Souhaité le {formatDateTime(opportunity.desired_delivery_at)}
                </Badge>
              )}
            </div>
            {opportunity.customer_notes && (
              <div className="mt-2 flex items-start gap-2 rounded-md bg-background p-2 text-xs">
                <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <p className="italic text-muted-foreground">« {opportunity.customer_notes} »</p>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Prix unitaire ({opportunity.currency})</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number" step="0.01" min="0"
                  value={unitPrice || ""}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="pl-8 font-mono"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Délai estimé (jours)</Label>
              <Input
                type="number" min="1"
                value={leadTime}
                onChange={(e) => setLeadTime(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Frais de livraison (optionnel)</Label>
            <Input
              type="number" step="100" min="0"
              value={deliveryFee || ""}
              onChange={(e) => setDeliveryFee(Number(e.target.value))}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes au client (optionnel)</Label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Délai garanti, options incluses, conditions particulières…"
            />
          </div>

          {/* Récap total */}
          {unitPrice > 0 && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span className="font-mono">{formatCurrency(total, opportunity.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>TVA 18%</span>
                <span>{formatCurrency(total * 0.18, opportunity.currency)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Livraison</span>
                  <span>{formatCurrency(Number(deliveryFee), opportunity.currency)}</span>
                </div>
              )}
              <div className="mt-2 flex items-baseline justify-between border-t pt-2">
                <span className="font-semibold">Total TTC</span>
                <span className="font-display text-lg font-bold text-orange-400">
                  {formatCurrency(totalTtc, opportunity.currency)}
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            💡 Si votre offre est acceptée, ce produit sera <strong>automatiquement ajouté</strong> à
            votre catalogue avec votre prix actuel.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={respond.isPending || unitPrice <= 0}>
            {respond.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer mon offre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const decline = useDeclineOpportunity();

  const handleDecline = async () => {
    try {
      await decline.mutateAsync(opportunity.id);
      toast.success("Opportunité ignorée");
    } catch {
      toast.error("Échec");
    }
  };

  return (
    <Card className="surface-premium">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-orange-500/20">
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-rose-500 text-xs text-white">
                {opportunity.customer_initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{opportunity.product_detail.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {opportunity.product_detail.category} · {opportunity.reference}
              </p>
            </div>
          </div>
          <Badge variant="warning" className="gap-1">
            <Flame className="h-3 w-3" /> Opportunité
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {opportunity.product_detail.short_description}
        </p>

        {/* Détails */}
        <div className="grid gap-2 rounded-lg border bg-secondary/30 p-3 text-sm md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <span><strong>{opportunity.quantity}</strong> pièces</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">
              {opportunity.delivery_city || "—"}, {opportunity.delivery_country}
            </span>
          </div>
          {opportunity.budget_max && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Budget max : <strong className="font-mono">
                  {formatCurrency(Number(opportunity.budget_max), opportunity.currency)}
                </strong>
              </span>
            </div>
          )}
          {opportunity.desired_delivery_at && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Souhaité avant le {formatDateTime(opportunity.desired_delivery_at)}</span>
            </div>
          )}
        </div>

        {opportunity.customer_notes && (
          <div className="rounded-md border-l-2 border-orange-500/50 bg-muted/30 px-3 py-2 text-xs italic text-muted-foreground">
            « {opportunity.customer_notes} »
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <span className="text-xs text-muted-foreground">
            Publié {timeAgo(opportunity.created_at)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={handleDecline}
              disabled={decline.isPending}
            >
              <X className="mr-1 h-3.5 w-3.5" /> Ignorer
            </Button>
            <RespondDialog opportunity={opportunity} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OpportunitiesPage() {
  const { data, isLoading } = useOpportunities();
  const opportunities = (data as Opportunity[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Opportunités</h1>
          <p className="text-sm text-muted-foreground">
            Demandes clients pour des produits que vous n&apos;avez pas encore activés.
            Saisissez-les pour enrichir votre catalogue !
          </p>
        </div>
        <Badge variant="default" className="gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Mise à jour temps réel
        </Badge>
      </div>

      {/* Encart explication */}
      <Card className="surface-premium border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold">Comment ça marche ?</p>
            <p className="text-muted-foreground">
              1. Un client demande un produit que personne ne propose · 2. Vous voyez la demande
              ici · 3. Vous proposez un prix et un délai · 4. Si l&apos;offre est acceptée, le produit
              est <strong>automatiquement ajouté</strong> à votre catalogue.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : opportunities.length === 0 ? (
        <Card className="surface-premium">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Aucune opportunité ouverte</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Toutes les demandes client actuelles sont couvertes par vos produits ou
                ceux d&apos;autres imprimeurs. Vous serez notifié dès qu&apos;une nouvelle opportunité apparaît.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{opportunities.length}</strong>{" "}
            opportunité{opportunities.length > 1 ? "s" : ""} disponible{opportunities.length > 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
