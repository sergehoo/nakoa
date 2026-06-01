"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/hooks/use-catalog";
import { api, endpoints } from "@/lib/api/client";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(slug);
  const [quantity, setQuantity] = useState(500);
  const [optionValues, setOptionValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedValueIds = useMemo(() => Object.values(optionValues).filter(Boolean), [optionValues]);

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

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
          {product.cover_image ? (
            <Image src={product.cover_image} alt={product.name} fill className="object-cover" />
          ) : null}
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="mt-2 text-muted-foreground">{product.short_description}</p>
        {product.description && (
          <div className="prose prose-sm mt-4 max-w-none dark:prose-invert">
            <p>{product.description}</p>
          </div>
        )}
      </div>

      <Card className="h-fit sticky top-24">
        <CardHeader>
          <CardTitle>Configurer & demander un devis</CardTitle>
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
            <p className="text-xs text-muted-foreground">Minimum {product.min_quantity} pièces.</p>
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
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected ? "border-primary bg-primary/10 text-primary" : "hover:bg-secondary"
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Délai estimé</p>
              <p className="font-semibold">{product.lead_time_days} jours ouvrés</p>
            </div>
            <Badge variant="success">Disponible</Badge>
          </div>

          <Button onClick={onRequestQuote} disabled={submitting} size="lg" className="w-full">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Recevoir des offres
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Gratuit · Sans engagement · Réponse sous 10 secondes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
