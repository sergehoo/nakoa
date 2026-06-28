"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  usePremiumServices,
  usePriceServices,
  type PremiumService,
  type PricingResult,
} from "@/hooks/use-premium-services";
import { formatCurrency } from "@/lib/utils";

/**
 * Sélecteur de services premium réutilisable.
 *
 * Props :
 * - orderTotal  : total commande pour les services tarifés en pourcentage
 * - currency    : devise (XOF par défaut)
 * - onChange    : callback avec (selection, pricing) à chaque modification
 * - categoryFilter : optionnel, ne montre que les services d'une catégorie
 */
export function ServicesPicker({
  orderTotal,
  currency = "XOF",
  categoryFilter,
  onChange,
}: {
  orderTotal: number;
  currency?: string;
  categoryFilter?: string;
  onChange?: (
    selection: { service_code: string; quantity: number }[],
    pricing: PricingResult | null,
  ) => void;
}) {
  const { data: services, isLoading } = usePremiumServices(categoryFilter);
  const price = usePriceServices();

  // selection map : code → quantity
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [pricing, setPricing] = useState<PricingResult | null>(null);

  const toggle = (code: string) => {
    setSelection((s) => {
      const next = { ...s };
      if (next[code]) delete next[code];
      else next[code] = 1;
      return next;
    });
  };

  const setQty = (code: string, qty: number) => {
    setSelection((s) => ({ ...s, [code]: Math.max(1, qty) }));
  };

  // Recompute pricing on selection change
  useEffect(() => {
    const list = Object.entries(selection).map(([code, qty]) => ({
      service_code: code,
      quantity: qty,
    }));
    if (list.length === 0) {
      setPricing(null);
      onChange?.([], null);
      return;
    }
    let cancel = false;
    price
      .mutateAsync({ selection: list, order_total: orderTotal, currency })
      .then((res) => {
        if (cancel) return;
        setPricing(res);
        onChange?.(list, res);
      })
      .catch(() => {
        if (!cancel) {
          setPricing(null);
          onChange?.(list, null);
        }
      });
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, orderTotal, currency]);

  const grouped = useMemo(() => {
    const groups = new Map<string, PremiumService[]>();
    for (const s of services ?? []) {
      const key = s.category_name ?? "Autres";
      const arr = groups.get(key) ?? [];
      arr.push(s);
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  }, [services]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des services…</p>;
  }
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-semibold tracking-tight">
          Services premium <Sparkles className="inline h-4 w-4 text-orange-500" />
        </h3>
        <p className="text-xs text-muted-foreground">
          Ajoute des options professionnelles à ta commande.
        </p>
      </div>

      {grouped.map(([groupName, items]) => (
        <div key={groupName} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {groupName}
          </p>
          <div className="grid gap-2">
            {items
              .filter((s) => s.is_visible && s.is_active)
              .map((s) => (
                <ServiceLine
                  key={s.id}
                  service={s}
                  selected={!!selection[s.code]}
                  quantity={selection[s.code] ?? 0}
                  onToggle={() => toggle(s.code)}
                  onQuantity={(q) => setQty(s.code, q)}
                  orderTotal={orderTotal}
                />
              ))}
          </div>
        </div>
      ))}

      {pricing && pricing.lines.length > 0 && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-sm font-semibold">Sous-total services premium</p>
          <div className="mt-2 space-y-1 text-sm">
            {pricing.lines.map((l) => (
              <div key={l.service_code} className="flex justify-between text-muted-foreground">
                <span>
                  {l.service_name}
                  {l.quantity > 1 && ` ×${l.quantity}`}
                </span>
                <span>{formatCurrency(Number(l.total))}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(Number(pricing.subtotal))} {pricing.currency}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceLine({
  service,
  selected,
  quantity,
  onToggle,
  onQuantity,
  orderTotal,
}: {
  service: PremiumService;
  selected: boolean;
  quantity: number;
  onToggle: () => void;
  onQuantity: (q: number) => void;
  orderTotal: number;
}) {
  // Label de prix affiché
  const priceLabel = (() => {
    if (service.pricing_type === "percentage") {
      const pct = (Number(service.percentage) * 100).toFixed(1);
      const preview = (orderTotal * Number(service.percentage)).toFixed(0);
      return `${pct}% (≈ ${formatCurrency(Number(preview))})`;
    }
    if (service.pricing_type === "variable") return "Sur devis";
    if (service.pricing_type === "per_unit") return `${formatCurrency(Number(service.base_price))}/unité`;
    return formatCurrency(Number(service.base_price));
  })();

  return (
    <Card className={selected ? "border-pink-500/40 bg-pink-500/5" : ""}>
      <CardContent className="flex items-start gap-3 p-4">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
            selected
              ? "border-pink-500 bg-pink-500 text-white"
              : "border-input hover:border-pink-500/50"
          }`}
        >
          {selected && <Check className="h-3 w-3" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{service.name}</p>
            {service.is_required && (
              <Badge className="bg-orange-500/15 text-orange-600 text-[10px]">
                Recommandé
              </Badge>
            )}
            {service.estimated_hours > 0 && (
              <Badge variant="outline" className="text-[10px]">
                <Clock className="mr-0.5 h-3 w-3" /> +{service.estimated_hours}h
              </Badge>
            )}
          </div>
          {service.short_description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{service.short_description}</p>
          )}

          {selected && service.pricing_type === "per_unit" && (
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Quantité :</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => onQuantity(Number(e.target.value) || 1)}
                className="w-20 rounded-md border bg-background px-2 py-1 text-sm"
              />
            </div>
          )}
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold">{priceLabel}</p>
          <p className="text-[10px] text-muted-foreground">{service.currency}</p>
        </div>
      </CardContent>
    </Card>
  );
}
