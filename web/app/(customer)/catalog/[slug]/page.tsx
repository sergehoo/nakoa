"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight, Award, Boxes, Building2, CheckCircle2, Clock,
  Crown, Filter, Flame, Info, Loader2, MapPin, ShieldCheck,
  Sparkles, Star, TrendingDown, Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProduct } from "@/hooks/use-catalog";
import { useProductOfferings, type ProductOffering } from "@/hooks/use-printer-products";
import { api, endpoints } from "@/lib/api/client";
import { cn, formatCurrency } from "@/lib/utils";

type SortKey = "price" | "lead_time" | "quality";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(slug);
  const { data: offerings, isLoading: offersLoading } = useProductOfferings(product?.id);
  const offers = (offerings as ProductOffering[] | undefined) ?? [];

  const [quantity, setQuantity] = useState(500);
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sort, setSort] = useState<SortKey>("price");
  const [expressOnly, setExpressOnly] = useState(false);

  const selectedValueIds = useMemo(() => Object.values(optionValues).filter(Boolean), [optionValues]);

  // Tri + filtre + badges intelligents
  const sortedOffers = useMemo(() => {
    let list = [...offers];
    if (expressOnly) list = list.filter((o) => o.is_express_available);
    list.sort((a, b) => {
      if (sort === "price") return Number(a.min_price) - Number(b.min_price);
      if (sort === "lead_time") return a.standard_lead_time_days - b.standard_lead_time_days;
      // quality : meilleur score d'abord
      return b.printer_detail.quality_score - a.printer_detail.quality_score;
    });
    return list;
  }, [offers, sort, expressOnly]);

  // Identifie l'offre "meilleur prix", "meilleur délai", "meilleur score"
  const badges = useMemo(() => {
    if (offers.length === 0) return {};
    const best_price = [...offers].sort((a, b) => Number(a.min_price) - Number(b.min_price))[0]?.id;
    const fastest = [...offers].sort((a, b) => a.standard_lead_time_days - b.standard_lead_time_days)[0]?.id;
    const top_quality = [...offers].sort((a, b) => b.printer_detail.quality_score - a.printer_detail.quality_score)[0]?.id;
    return { best_price, fastest, top_quality };
  }, [offers]);

  const onRequestQuote = async () => {
    if (!product) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(endpoints.quotes.create, {
        product: product.id,
        quantity,
        option_values: selectedValueIds,
        delivery_country: "CI",
      });
      await api.post(endpoints.quotes.submit(data.id));
      toast.success("Demande envoyée — offres en cours de calcul");
      router.push(`/quotes/${data.id}`);
    } catch {
      toast.error("Impossible de créer la demande de devis");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !product) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  const fromPrice = offers.length > 0
    ? Math.min(...offers.map((o) => Number(o.min_price)))
    : 0;

  return (
    <div className="space-y-8">
      {/* En-tête produit */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Visuel + description */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border">
            {product.cover_image ? (
              <Image src={product.cover_image} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Boxes className="h-24 w-24 text-orange-400/30" />
              </div>
            )}
            {offers.length > 0 && (
              <Badge variant="default" className="absolute left-4 top-4 gap-1 backdrop-blur">
                <Sparkles className="h-3 w-3" /> {offers.length} imprimeur{offers.length > 1 ? "s" : ""} disponible{offers.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight lg:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{product.short_description}</p>

          {/* Stats compacts */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm">
              <Clock className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-muted-foreground">Délai standard</span>
              <span className="font-semibold">{product.lead_time_days}j</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm">
              <Boxes className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-muted-foreground">Quantité min.</span>
              <span className="font-semibold">{product.min_quantity}</span>
            </div>
            {fromPrice > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-1.5 text-sm">
                <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-muted-foreground">À partir de</span>
                <span className="font-semibold text-emerald-400">
                  {formatCurrency(fromPrice, offers[0]?.currency ?? "XOF")}
                </span>
              </div>
            )}
          </div>

          {product.description && (
            <div className="prose prose-sm mt-6 max-w-none dark:prose-invert">
              <p>{product.description}</p>
            </div>
          )}
        </div>

        {/* Configurateur sticky */}
        <Card className="surface-premium h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Configurer & demander un devis</CardTitle>
            <p className="text-xs text-muted-foreground">
              Recevez les offres de plusieurs imprimeurs en temps réel.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantité</Label>
              <Input
                id="qty"
                type="number"
                min={product.min_quantity}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum {product.min_quantity} pièces.
              </p>
            </div>

            {product.options?.map((opt) => (
              <div key={opt.id} className="space-y-2">
                <Label>{opt.name}</Label>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((v) => {
                    const selected = optionValues[opt.id] === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setOptionValues((prev) => ({ ...prev, [opt.id]: v.id }))}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "border-orange-500 bg-orange-500/10 text-orange-400"
                            : "hover:bg-secondary",
                        )}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <Button onClick={onRequestQuote} disabled={submitting} size="lg" className="w-full">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Recevoir des offres personnalisées
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Gratuit · Sans engagement · Réponse sous 10 secondes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section offres imprimeurs */}
      <Card className="surface-premium">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-400" />
              Imprimeurs qui proposent ce produit
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {offers.length === 0
                ? "Aucun imprimeur n'a encore activé ce produit. Demandez un devis pour déclencher des opportunités."
                : `Comparez ${offers.length} offre${offers.length > 1 ? "s" : ""} et choisissez l'imprimeur qui vous convient.`}
            </p>
          </div>

          {offers.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={expressOnly ? "default" : "outline"}
                onClick={() => setExpressOnly((v) => !v)}
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" /> Express
              </Button>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-9 w-[180px]">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Prix croissant</SelectItem>
                  <SelectItem value="lead_time">Délai croissant</SelectItem>
                  <SelectItem value="quality">Qualité décroissante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {offersLoading ? (
            <div className="space-y-2 p-6">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : sortedOffers.length === 0 ? (
            <div className="space-y-4 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10">
                <Sparkles className="h-7 w-7 text-orange-400" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Aucune offre encore — créons une opportunité</p>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  Faites une demande de devis et nous notifions tous nos imprimeurs partenaires
                  capables de produire <strong>{product.name}</strong>. Vous recevrez leurs offres en temps réel.
                </p>
              </div>
              <Button onClick={onRequestQuote} disabled={submitting}>
                <Sparkles className="mr-2 h-4 w-4" /> Lancer une demande
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {sortedOffers.map((offer, idx) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  isBestPrice={badges.best_price === offer.id}
                  isFastest={badges.fastest === offer.id}
                  isTopQuality={badges.top_quality === offer.id}
                  rank={idx + 1}
                  onSelect={onRequestQuote}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// OfferRow — ligne d'offre imprimeur avec badges intelligents
// ============================================================================
function OfferRow({
  offer, isBestPrice, isFastest, isTopQuality, rank, onSelect,
}: {
  offer: ProductOffering;
  isBestPrice: boolean;
  isFastest: boolean;
  isTopQuality: boolean;
  rank: number;
  onSelect: () => void;
}) {
  const p = offer.printer_detail;
  const quality = p.quality_score;

  return (
    <div className="grid items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/30 md:grid-cols-[auto_1fr_auto_auto_auto]">
      {/* Rank + Logo */}
      <div className="flex items-center gap-3">
        <div className="hidden h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-mono text-muted-foreground md:flex">
          #{rank}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/5 text-orange-400">
          <Building2 className="h-5 w-5" />
        </div>
      </div>

      {/* Imprimeur + badges */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{p.trade_name}</p>
          {p.is_featured && (
            <Badge variant="default" className="gap-1 text-[10px]">
              <Crown className="h-3 w-3" /> Premium
            </Badge>
          )}
          {isBestPrice && (
            <Badge variant="success" className="gap-1 text-[10px]">
              <TrendingDown className="h-3 w-3" /> Meilleur prix
            </Badge>
          )}
          {isFastest && (
            <Badge variant="warning" className="gap-1 text-[10px]">
              <Zap className="h-3 w-3" /> Plus rapide
            </Badge>
          )}
          {isTopQuality && (
            <Badge variant="default" className="gap-1 text-[10px]">
              <Award className="h-3 w-3" /> Top qualité
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {p.city ? `${p.city}, ` : ""}{p.country}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">{quality.toFixed(0)}</span>/100
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>{p.on_time_rate.toFixed(0)}%</span> à l&apos;heure
          </span>
        </div>
      </div>

      {/* Délai */}
      <div className="hidden text-right md:block">
        <p className="text-xs text-muted-foreground">Délai</p>
        <p className="font-semibold">{offer.standard_lead_time_days}j</p>
        {offer.is_express_available && (
          <p className="text-[10px] text-amber-400">Express {offer.express_lead_time_days}j</p>
        )}
      </div>

      {/* Prix */}
      <div className="text-right">
        <p className="text-xs text-muted-foreground">À partir de</p>
        <p className="font-display text-xl font-bold tabular-nums">
          {formatCurrency(Number(offer.min_price), offer.currency)}
        </p>
      </div>

      {/* CTA */}
      <Button onClick={onSelect} size="sm">
        Choisir
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
