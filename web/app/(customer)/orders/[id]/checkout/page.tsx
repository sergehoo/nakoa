"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, CheckCircle2, CreditCard, Loader2, Lock,
  Shield, Smartphone, Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useOrder } from "@/hooks/use-orders";
import { usePaymentMethods, type PaymentMethod } from "@/hooks/use-account";
import { api, endpoints } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CouponInput } from "@/components/promotions/coupon-input";
import type { ValidateResult } from "@/hooks/use-promotions";

interface PaymentProvider {
  code: "paystack" | "wave" | "orange_money" | "mtn_momo" | "moov" | "card_stripe";
  label: string;
  description: string;
  badge: string;
  needs_phone: boolean;
  recommended?: boolean;
}

const PROVIDERS: PaymentProvider[] = [
  {
    code: "paystack",
    label: "Paystack",
    description: "Cartes bancaires + Mobile Money — paiement instantané sécurisé",
    badge: "Recommandé",
    needs_phone: false,
    recommended: true,
  },
  {
    code: "wave",
    label: "Wave",
    description: "Paiement Mobile Money sans frais (CI, SN)",
    badge: "",
    needs_phone: true,
  },
  {
    code: "orange_money",
    label: "Orange Money",
    description: "Mobile Money Orange (CI, SN, ML, BF, etc.)",
    badge: "",
    needs_phone: true,
  },
  {
    code: "mtn_momo",
    label: "MTN MoMo",
    description: "MTN Mobile Money (CI, BJ, CM, GH)",
    badge: "",
    needs_phone: true,
  },
  {
    code: "moov",
    label: "Moov Money",
    description: "Mobile Money Moov Africa (CI, BJ, TG)",
    badge: "",
    needs_phone: true,
  },
  {
    code: "card_stripe",
    label: "Carte bancaire (Stripe)",
    description: "Visa, Mastercard — paiement sécurisé via Stripe (international)",
    badge: "",
    needs_phone: false,
  },
];

function ProviderIcon({ code }: { code: PaymentProvider["code"] }) {
  if (code === "card_stripe" || code === "paystack") return <CreditCard className="h-5 w-5" />;
  return <Smartphone className="h-5 w-5" />;
}

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(id);
  const { data: savedMethods } = usePaymentMethods();
  const methodsList = (savedMethods as PaymentMethod[] | undefined) ?? [];

  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider["code"]>("paystack");
  const [phone, setPhone] = useState("");
  const [savedMethodId, setSavedMethodId] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateResult | null>(null);

  // Préselectionne la méthode par défaut sauvegardée
  const defaultMethod = methodsList.find((m) => m.is_default);

  const initiate = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        order_id: id,
        provider_code: selectedProvider,
        return_url: `${window.location.origin}/orders/${id}/payment-callback`,
      };
      if (appliedCoupon?.code) {
        // Le backend pourra appliquer/valider le code à la création du paiement.
        payload.coupon_code = appliedCoupon.code;
      }
      const provider = PROVIDERS.find((p) => p.code === selectedProvider);
      if (provider?.needs_phone) {
        payload.phone_number = phone || defaultMethod?.phone_number || "";
        if (!payload.phone_number) {
          throw new Error("Numéro de téléphone requis pour " + provider.label);
        }
      }
      const { data } = await api.post(endpoints.payments.initiate, payload);
      return data as {
        payment_id: string;
        checkout_url?: string;
        instructions?: string;
        status: string;
      };
    },
    onSuccess: (data) => {
      if (data.checkout_url) {
        toast.success("Redirection vers la page de paiement…");
        window.location.href = data.checkout_url;
      } else {
        toast.success("Paiement initié", {
          description: data.instructions ?? "Suivez les instructions sur votre téléphone.",
        });
        router.push(`/orders/${id}`);
      }
    },
    onError: (e: unknown) => {
      const err = e as { message?: string; response?: { data?: { detail?: string } } };
      toast.error("Échec du paiement", {
        description: err?.response?.data?.detail ?? err?.message ?? "Réessayez dans un instant.",
      });
    },
  });

  if (isLoading || !order) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-96" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const selectedProviderObj = PROVIDERS.find((p) => p.code === selectedProvider)!;
  const orderTotalRaw = Number(order.total_incl_tax);
  const discount = appliedCoupon ? Number(appliedCoupon.discount_amount) : 0;
  const orderTotal = Math.max(0, orderTotalRaw - discount);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href={`/orders/${id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Détail commande
          </Link>
        </Button>
        <h1 className="font-display text-3xl font-bold tracking-tight">Paiement</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez votre méthode de paiement pour finaliser la commande {order.reference}.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonne paiement */}
        <div className="space-y-4 md:col-span-2">
          {/* Méthodes sauvegardées */}
          {methodsList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vos méthodes enregistrées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {methodsList.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSavedMethodId(m.id);
                      setSelectedProvider(m.kind as PaymentProvider["code"]);
                      if (m.phone_number) setPhone(m.phone_number);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-secondary/50",
                      savedMethodId === m.id && "border-primary bg-primary/5 ring-1 ring-primary",
                    )}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{m.label || m.kind}</p>
                      {m.phone_number && (
                        <p className="text-xs font-mono text-muted-foreground">{m.phone_number}</p>
                      )}
                    </div>
                    {m.is_default && (
                      <Badge variant="secondary">Par défaut</Badge>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Choix d'une nouvelle méthode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {methodsList.length > 0 ? "Ou choisir une autre méthode" : "Méthode de paiement"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(p.code);
                    setSavedMethodId(null);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-secondary/50",
                    selectedProvider === p.code && !savedMethodId && "border-primary bg-primary/5 ring-1 ring-primary",
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-foreground">
                    <ProviderIcon code={p.code} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{p.label}</p>
                      {p.badge && <Badge variant="default" className="text-[10px]">{p.badge}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </div>
                  {selectedProvider === p.code && !savedMethodId && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Saisie numéro Mobile Money */}
          {selectedProviderObj.needs_phone && !savedMethodId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Numéro {selectedProviderObj.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+225 07 XX XX XX XX"
                      className="pl-9 font-mono"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Le numéro associé à votre compte {selectedProviderObj.label}.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CB Stripe placeholder */}
          {selectedProviderObj.code === "card_stripe" && !savedMethodId && (
            <Card className="border-dashed">
              <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Vous serez redirigé vers la page sécurisée Stripe pour saisir votre carte.
                  Vos données bancaires ne transitent jamais par nos serveurs.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne récap commande */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Référence</span>
                <span className="font-mono">{order.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produit</span>
                <span className="text-right font-medium">{order.product_detail?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantité</span>
                <span>{order.quantity}</span>
              </div>
              {order.printer_detail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Imprimeur</span>
                  <span className="text-right font-medium">{order.printer_detail.trade_name}</span>
                </div>
              )}
              {order.expected_delivery_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison estimée</span>
                  <span>{formatDateTime(order.expected_delivery_at)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span>{formatCurrency(Number(order.total_excl_tax), order.currency)}</span>
              </div>
              {Number(order.vat_amount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA</span>
                  <span>{formatCurrency(Number(order.vat_amount), order.currency)}</span>
                </div>
              )}
              {Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>{formatCurrency(Number(order.delivery_fee), order.currency)}</span>
                </div>
              )}

              {/* Code promo */}
              <div className="space-y-2 rounded-md border border-dashed bg-secondary/20 p-3">
                <CouponInput
                  orderTotal={orderTotalRaw}
                  onApplied={(res) => setAppliedCoupon(res)}
                  onCleared={() => setAppliedCoupon(null)}
                />
              </div>

              {appliedCoupon && discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="font-medium">
                    Remise ({appliedCoupon.code})
                  </span>
                  <span>− {formatCurrency(discount, order.currency)}</span>
                </div>
              )}

              <Separator />

              <div className="flex items-baseline justify-between">
                <span className="font-semibold">Total à payer</span>
                <div className="text-right">
                  {discount > 0 && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatCurrency(orderTotalRaw, order.currency)}
                    </p>
                  )}
                  <span className="font-display text-2xl font-bold">
                    {formatCurrency(orderTotal, order.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={() => initiate.mutate()}
            disabled={initiate.isPending}
          >
            {initiate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="mr-2 h-4 w-4" />
            )}
            Payer {formatCurrency(orderTotal, order.currency)}
          </Button>

          <Card className="border-dashed">
            <CardContent className="space-y-2 p-4 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <p>
                  <strong className="text-foreground">Paiement séquestré.</strong> Vos fonds sont
                  retenus jusqu&apos;à la livraison validée. En cas de problème, vous êtes remboursé.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
