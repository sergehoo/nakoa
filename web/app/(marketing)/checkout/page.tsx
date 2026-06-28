"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Check, CreditCard, Loader2, Lock, ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CouponInput } from "@/components/promotions/coupon-input";
import { useAuth } from "@/hooks/use-auth";
import { useCart, type CartItem } from "@/stores/cart";
import { useShopHydrated } from "@/hooks/use-shop-hydration";
import { api, endpoints } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils";
import type { ValidateResult } from "@/hooks/use-promotions";

const DELIVERY_OPTIONS = [
  { code: "pickup", label: "Retrait en atelier", fee: 0, eta: "1-2 j" },
  { code: "city", label: "Livraison en ville", fee: 2500, eta: "24-48h" },
  { code: "express", label: "Livraison express (Abidjan)", fee: 5000, eta: "<24h" },
];

const PAYMENT_OPTIONS = [
  { code: "paystack", label: "Carte / Mobile Money (Paystack)" },
  { code: "wave", label: "Wave" },
  { code: "orange_money", label: "Orange Money" },
  { code: "mtn_momo", label: "MTN MoMo" },
  { code: "moov", label: "Moov Money" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useShopHydrated();
  const { isAuthenticated, isReady } = useAuth();

  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clearCart = useCart((s) => s.clear);

  const [deliveryCode, setDeliveryCode] = useState("pickup");
  const [paymentCode, setPaymentCode] = useState("paystack");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [coupon, setCoupon] = useState<ValidateResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Si pas authentifié → redirige login avec next=/checkout (le panier reste persisté)
  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace(`/login?from=${encodeURIComponent("/checkout")}`);
    }
  }, [isReady, isAuthenticated, router]);

  if (!hydrated || !isReady) {
    return (
      <>
        <MarketingHeader />
        <div className="container py-12">
          <div className="h-40 animate-pulse rounded-2xl bg-secondary/30" />
        </div>
      </>
    );
  }

  // Panier vide → redirige vers /cart
  if (items.length === 0) {
    return (
      <>
        <MarketingHeader />
        <div className="container py-16">
          <div className="mx-auto max-w-md space-y-4 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Aucun article à commander
            </h1>
            <Button asChild>
              <Link href="/products">Explorer le catalogue</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  const delivery = DELIVERY_OPTIONS.find((d) => d.code === deliveryCode)!;
  const discount = coupon ? Number(coupon.discount_amount) : 0;
  const total = Math.max(0, subtotal + delivery.fee - discount);

  const onConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Crée une QuoteRequest groupant tous les articles. Le backend matche
      // ensuite des imprimeurs et envoie les notifications.
      const payload = {
        title: `Commande Nakoa — ${items.length} article${items.length > 1 ? "s" : ""}`,
        notes: notes || undefined,
        delivery_address: address || undefined,
        delivery_city: city || undefined,
        delivery_phone: phone || undefined,
        delivery_option: delivery.code,
        payment_provider: paymentCode,
        coupon_code: coupon?.code || undefined,
        items: items.map((i: CartItem) => ({
          product: i.productId,
          quantity: i.quantity,
          options: i.options,
          notes: i.optionsLabel,
        })),
      };
      await api.post(endpoints.quotes.create, payload);
      toast.success("Commande envoyée 🎉", {
        description: "Tu vas recevoir les offres des imprimeurs sous peu.",
      });
      clearCart();
      router.push("/quotes");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: unknown } } };
      const detail = err?.response?.data?.detail;
      toast.error("Échec de la commande", {
        description: typeof detail === "string" ? detail : "Vérifie tes informations.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <MarketingHeader />
      <div className="container py-10">
        <div className="mb-6 flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-medium text-muted-foreground">
            Commande sécurisée · SSL & paiement chiffré
          </span>
        </div>
        <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">
          Finaliser ma commande
        </h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne formulaire */}
          <div className="space-y-4 lg:col-span-2">
            {/* Livraison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1. Mode de livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DELIVERY_OPTIONS.map((opt) => (
                  <label
                    key={opt.code}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition ${
                      deliveryCode === opt.code
                        ? "border-pink-500 bg-pink-500/5"
                        : "hover:border-orange-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="delivery"
                        value={opt.code}
                        checked={deliveryCode === opt.code}
                        onChange={(e) => setDeliveryCode(e.target.value)}
                        className="h-4 w-4 accent-pink-500"
                      />
                      <div>
                        <p className="font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">Délai : {opt.eta}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {opt.fee > 0 ? formatCurrency(opt.fee) + " XOF" : "Gratuit"}
                    </Badge>
                  </label>
                ))}

                {deliveryCode !== "pickup" && (
                  <div className="grid gap-3 pt-3 md:grid-cols-2">
                    <div>
                      <Label>Ville</Label>
                      <Input
                        placeholder="Abidjan"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input
                        type="tel"
                        placeholder="+225 ..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Adresse de livraison</Label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Quartier, rue, point de repère…"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paiement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. Mode de paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.code}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      paymentCode === opt.code
                        ? "border-pink-500 bg-pink-500/5"
                        : "hover:border-orange-500/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.code}
                      checked={paymentCode === opt.code}
                      onChange={(e) => setPaymentCode(e.target.value)}
                      className="h-4 w-4 accent-pink-500"
                    />
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{opt.label}</span>
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. Instructions particulières</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Précisions sur ta commande (couleurs, finitions spécifiques, urgence…)"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Récapitulatif */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
                  {items.map((i) => (
                    <li key={i.lineId} className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate">{i.productName}</p>
                        <p className="text-xs text-muted-foreground">×{i.quantity}</p>
                      </div>
                      <span className="shrink-0">
                        {i.unitPrice > 0
                          ? formatCurrency(i.unitPrice * i.quantity)
                          : "Devis"}
                      </span>
                    </li>
                  ))}
                </ul>

                <Separator />

                <CouponInput
                  orderTotal={subtotal}
                  onApplied={setCoupon}
                  onCleared={() => setCoupon(null)}
                />

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>{delivery.fee > 0 ? formatCurrency(delivery.fee) : "Gratuit"}</span>
                  </div>
                  {discount > 0 && coupon && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Remise ({coupon.code})</span>
                      <span>− {formatCurrency(discount)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-2xl font-bold">
                    {formatCurrency(total)}
                  </span>
                </div>

                <Button
                  onClick={onConfirm}
                  disabled={submitting}
                  size="lg"
                  className="w-full"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Confirmer la commande
                </Button>
                <p className="text-center text-[10px] text-muted-foreground">
                  En confirmant, tu acceptes nos{" "}
                  <Link href="/legal/cgu" className="underline">CGU</Link>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
