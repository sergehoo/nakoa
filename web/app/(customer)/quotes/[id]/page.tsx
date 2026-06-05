"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Brain, Check, Clock, MapPin, Star, TrendingDown, Trophy } from "lucide-react";
import { toast } from "sonner";
import { api, endpoints } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteRequest } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";

const TAG_META: Record<string, { icon: typeof Brain; label: string; variant: "default" | "success" | "warning" }> = {
  recommended: { icon: Brain, label: "Recommandée IA", variant: "default" },
  best_price: { icon: TrendingDown, label: "Meilleur prix", variant: "success" },
  fastest: { icon: Clock, label: "Plus rapide", variant: "warning" },
  premium: { icon: Trophy, label: "Premium", variant: "default" },
  nearest: { icon: MapPin, label: "Le plus proche", variant: "default" },
  standard: { icon: Star, label: "Standard", variant: "default" },
};

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: quote, isLoading } = useQuery<QuoteRequest>({
    queryKey: ["quote", id],
    queryFn: async () => {
      const { data } = await api.get(endpoints.quotes.detail(id));
      return data;
    },
    refetchInterval: 5000, // poll en attendant les offres
  });

  const select = useMutation({
    mutationFn: async (offerId: string) => {
      await api.post(endpoints.quotes.selectOffer(id), { offer_id: offerId });
      const { data } = await api.post(endpoints.quotes.convert(id));
      return data;
    },
    onSuccess: (data) => {
      toast.success("Commande créée, redirection vers le paiement…");
      router.push(`/orders/${data.order_id}/checkout`);
    },
    onError: () => toast.error("Impossible de créer la commande"),
  });

  if (isLoading || !quote) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{quote.reference}</h1>
        <p className="text-sm text-muted-foreground">
          {quote.product_detail?.name} · {quote.quantity} pièces
        </p>
      </div>

      {quote.status === "open" || quote.status === "draft" ? (
        <Card>
          <CardContent className="space-y-3 p-8 text-center">
            <Brain className="mx-auto h-10 w-10 animate-pulse text-primary" />
            <h2 className="font-semibold">Le moteur IA analyse les imprimeurs disponibles…</h2>
            <p className="text-sm text-muted-foreground">Vous recevrez vos offres dans quelques secondes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {quote.offers?.map((offer) => {
            const meta = TAG_META[offer.tag] ?? TAG_META.standard;
            const Icon = meta.icon;
            return (
              <Card key={offer.id} className={offer.is_ai_recommended ? "border-primary shadow-md ring-1 ring-primary" : ""}>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{offer.printer.trade_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {offer.printer.city} · Score {offer.printer.quality_score}/100
                      </p>
                    </div>
                    <Badge variant={meta.variant} className="gap-1">
                      <Icon className="h-3 w-3" /> {meta.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Prix total TTC</p>
                      <p className="font-display text-xl font-bold">{formatCurrency(Number(offer.total_incl_tax), offer.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Délai estimé</p>
                      <p className="font-medium">{offer.estimated_lead_time_days} jours</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => select.mutate(offer.id)}
                    disabled={select.isPending}
                    className="w-full"
                    variant={offer.is_ai_recommended ? "default" : "outline"}
                  >
                    <Check className="h-4 w-4" /> Choisir cette offre
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
