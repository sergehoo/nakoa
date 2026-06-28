"use client";

import { useState } from "react";
import { Check, Loader2, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useValidateCoupon, type ValidateResult } from "@/hooks/use-promotions";
import { formatCurrency } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
  empty_code: "Saisis un code.",
  code_unknown: "Code inconnu.",
  code_unusable: "Ce code n'est plus utilisable.",
  campaign_inactive: "Cette campagne n'est plus active.",
  restricted_to_other_user: "Ce code est réservé à un autre compte.",
  below_min_order: "Le montant de la commande ne permet pas d'utiliser ce code.",
  per_user_limit_reached: "Tu as déjà utilisé ce code le nombre de fois autorisé.",
  conditions_not_met: "Ce code ne s'applique pas à cette commande.",
};

/**
 * Champ de saisie d'un code promo intégrable au checkout.
 *
 * Props :
 * - orderTotal : montant HT/TTC de la commande pour calculer le discount
 * - onApplied  : callback appelée avec ValidateResult quand le code est validé
 * - onCleared  : callback quand l'utilisateur retire le code
 */
export function CouponInput({
  orderTotal,
  onApplied,
  onCleared,
}: {
  orderTotal: number | string;
  onApplied?: (res: ValidateResult) => void;
  onCleared?: () => void;
}) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<ValidateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const validate = useValidateCoupon();

  const submit = async () => {
    setError(null);
    try {
      const res = await validate.mutateAsync({ code, order_total: orderTotal });
      if (res.ok) {
        setApplied(res);
        onApplied?.(res);
      } else {
        setApplied(null);
        setError(REASON_LABELS[res.reason ?? ""] ?? "Code refusé.");
      }
    } catch {
      setError("Erreur réseau. Réessaye.");
    }
  };

  const clear = () => {
    setApplied(null);
    setCode("");
    setError(null);
    onCleared?.();
  };

  if (applied) {
    const isFreeShipping = applied.discount_type === "free_shipping";
    return (
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold">
                Code{" "}
                <code className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-xs">
                  {applied.code}
                </code>{" "}
                appliqué
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {applied.campaign_name}
                {" · "}
                {isFreeShipping ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Livraison offerte
                  </Badge>
                ) : (
                  <>
                    Remise de{" "}
                    <strong className="text-foreground">
                      {formatCurrency(Number(applied.discount_amount))} {applied.currency}
                    </strong>
                  </>
                )}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Tag className="h-3.5 w-3.5" /> Code promo
      </label>
      <div className="flex gap-2">
        <Input
          placeholder="NAKOA20"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={64}
        />
        <Button
          type="button"
          variant="outline"
          onClick={submit}
          disabled={validate.isPending || !code}
        >
          {validate.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Appliquer"
          )}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
