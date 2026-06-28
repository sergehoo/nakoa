"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BadgeCheck, CheckCircle2, Clock, Heart, Loader2, MapPin, Minus, Package,
  Plus, ShieldCheck, ShoppingCart, Sparkles, Truck, Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { ProductIcon } from "@/components/shop/product-icon";
import { RatingStars } from "@/components/shop/rating-stars";
import { useProduct } from "@/hooks/use-catalog";
import { useProductPrinters, useProductReviews } from "@/hooks/use-product-detail";
import { useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { formatCurrency } from "@/lib/utils";

export default function ProductDetailPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug);
  const { data: printersData } = useProductPrinters(slug);
  const { data: reviewsData } = useProductReviews(slug);

  const printers = printersData?.results ?? [];
  const reviews = reviewsData?.results ?? [];
  const avgRating = reviewsData?.average ?? 0;
  const reviewsCount = reviewsData?.total ?? 0;

  const cart = useCart();
  const wishlist = useWishlist();

  // Sélection options + qty
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <>
        <MarketingHeader />
        <div className="container py-16 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }
  if (!product) {
    return (
      <>
        <MarketingHeader />
        <div className="container py-16 text-center">
          <p className="text-muted-foreground">Produit introuvable.</p>
          <Button asChild className="mt-4">
            <Link href="/products">Retour au catalogue</Link>
          </Button>
        </div>
      </>
    );
  }

  // Prix de base = min des PrinterProducts
  const fromPrice = printers.length > 0 ? Number(printers[0].min_price) : 0;
  const currency = printers[0]?.currency ?? "XOF";
  const minLead = printers.length > 0
    ? Math.min(...printers.map((p) => p.standard_lead_time_days))
    : product.lead_time_days || null;

  const wished = wishlist.isWished(product.id);

  const buildOptionsLabel = () => {
    const labels: string[] = [];
    for (const opt of product.options ?? []) {
      const valId = selectedOptions[opt.id];
      const val = opt.values.find((v) => v.id === valId);
      if (val) labels.push(`${opt.name}: ${val.label}`);
    }
    return labels.join(" · ");
  };

  const addToCart = () => {
    cart.addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: product.primary_image || product.cover_image || null,
      unitPrice: fromPrice,
      currency,
      quantity: quantity || product.min_quantity || 1,
      options: selectedOptions,
      optionsLabel: buildOptionsLabel() || undefined,
    });
    toast.success("Ajouté au panier", {
      description: `${product.name} ×${quantity}`,
      action: { label: "Voir", onClick: () => router.push("/cart") },
    });
  };

  const orderNow = () => {
    addToCart();
    router.push("/checkout");
  };

  const toggleWishlist = () => {
    const result = wishlist.toggle({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      productImage: product.primary_image || product.cover_image || null,
      unitPrice: fromPrice,
      currency,
      shortDescription: product.short_description,
    });
    toast.message(result === "added" ? "Ajouté aux favoris" : "Retiré des favoris");
  };

  return (
    <>
      <MarketingHeader />
      <div className="container py-8">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Accueil</Link>{" / "}
          <Link href="/products" className="hover:text-foreground">Catalogue</Link>{" / "}
          {product.category_name && (
            <>
              <Link
                href={`/products?category=${
                  typeof product.category === "object" ? product.category.slug : product.category
                }`}
                className="hover:text-foreground"
              >
                {product.category_name}
              </Link>{" / "}
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Visuel */}
          <div>
            <div className="overflow-hidden rounded-2xl">
              <ProductIcon
                product={{
                  slug: product.slug,
                  name: product.name,
                  primary_image: product.primary_image || product.cover_image,
                  category_name: product.category_name,
                  category: typeof product.category === "object" ? product.category : undefined,
                }}
                aspect="square"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {/* Galerie miniatures si plusieurs images */}
            {product.images && product.images.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.images.slice(0, 5).map((img) => (
                  <div key={img.id} className="aspect-square overflow-hidden rounded-lg bg-secondary">
                    {/* Pour des miniatures simples */}
                    <ProductIcon
                      product={{ primary_image: img.image, slug: product.slug, name: img.alt }}
                      aspect="square"
                      sizes="100px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Détails */}
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {product.is_featured && (
                  <Badge className="bg-pink-500 text-white">Populaire</Badge>
                )}
                {product.category_name && (
                  <Badge variant="outline">{product.category_name}</Badge>
                )}
                {minLead && (
                  <Badge variant="outline">
                    <Clock className="mr-1 h-3 w-3" /> Délai dès {minLead}j
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                {product.name}
              </h1>
              {product.short_description && (
                <p className="mt-2 text-base text-muted-foreground">
                  {product.short_description}
                </p>
              )}
            </div>

            {/* Note moyenne */}
            {reviewsCount > 0 && (
              <div className="flex items-center gap-2">
                <RatingStars value={avgRating} size={16} showValue />
                <span className="text-xs text-muted-foreground">
                  ({reviewsCount} avis)
                </span>
              </div>
            )}

            {/* Prix */}
            <div className="rounded-xl border bg-secondary/30 p-4">
              {fromPrice > 0 ? (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    À partir de
                  </p>
                  <p className="font-display text-3xl font-bold">
                    {formatCurrency(fromPrice)}{" "}
                    <span className="text-base font-normal text-muted-foreground">
                      {currency}
                    </span>
                  </p>
                  {printers.length > 1 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Proposé par {printers.length} imprimeur{printers.length > 1 ? "s" : ""}
                    </p>
                  )}
                </>
              ) : (
                <p className="font-display text-2xl font-semibold text-muted-foreground">
                  Sur devis
                </p>
              )}
            </div>

            {/* Options dynamiques */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-3">
                {product.options.map((opt) => (
                  <div key={opt.id}>
                    <label className="text-sm font-medium">
                      {opt.name}
                      {opt.required && <span className="text-destructive"> *</span>}
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {opt.values.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() =>
                            setSelectedOptions((s) => ({ ...s, [opt.id]: v.id }))
                          }
                          className={`rounded-md border px-3 py-1.5 text-sm transition ${
                            selectedOptions[opt.id] === v.id
                              ? "border-pink-500 bg-pink-500/10 text-pink-600"
                              : "hover:border-orange-500/50"
                          }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stepper quantité */}
            <div>
              <label className="text-sm font-medium">Quantité</label>
              <div className="mt-2 inline-flex items-center rounded-md border">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(product.min_quantity || 1, q - 1))}
                  className="px-3 py-1.5 text-muted-foreground hover:text-foreground"
                  aria-label="Diminuer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 border-x bg-transparent px-3 py-1.5 text-center text-sm"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1.5 text-muted-foreground hover:text-foreground"
                  aria-label="Augmenter"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {product.min_quantity && product.min_quantity > 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Minimum : {product.min_quantity}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" className="flex-1" onClick={orderNow}>
                <Zap className="mr-1.5 h-4 w-4" /> Commander maintenant
              </Button>
              <Button size="lg" variant="outline" className="flex-1" onClick={addToCart}>
                <ShoppingCart className="mr-1.5 h-4 w-4" /> Ajouter au panier
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={toggleWishlist}
                className={wished ? "text-pink-500" : ""}
                aria-label="Wishlist"
              >
                <Heart className="h-4 w-4" fill={wished ? "currentColor" : "none"} />
              </Button>
            </div>

            {/* Garanties */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border bg-secondary/20 p-3 text-xs">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Paiement sécurisé
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-emerald-500" /> Livraison tracée
              </div>
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> Qualité garantie
              </div>
            </div>
          </div>
        </div>

        {/* Description longue */}
        {product.description && (
          <section className="mt-12">
            <h2 className="mb-3 font-display text-xl font-semibold">Description</h2>
            <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground/80">
              {product.description}
            </div>
          </section>
        )}

        {/* Imprimeurs disponibles */}
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold">
              Imprimeurs disponibles
              {printers.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({printers.length})
                </span>
              )}
            </h2>
          </div>
          {printers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucun imprimeur n'a encore activé ce produit.{" "}
                <Link href="/checkout" className="text-primary hover:underline">
                  Lance ton devis pour recevoir des offres.
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {printers.map((p) => (
                <PrinterOfferCard key={p.id} offer={p} />
              ))}
            </div>
          )}
        </section>

        {/* Avis clients */}
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-semibold">
              Avis clients
              {reviewsCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({reviewsCount})
                </span>
              )}
            </h2>
            {avgRating > 0 && <RatingStars value={avgRating} size={16} showValue />}
          </div>
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucun avis pour le moment. Sois le premier à en laisser un après ta commande.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 6).map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {r.customer_name}
                          {r.is_verified && (
                            <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Imprimeur : {r.printer_name} · {new Date(r.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <RatingStars value={r.overall_rating} size={13} />
                    </div>
                    {r.title && <p className="mt-2 text-sm font-medium">{r.title}</p>}
                    {r.body && <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>}
                    {r.printer_response && (
                      <div className="mt-3 rounded-md border-l-2 border-pink-500 bg-secondary/30 p-2">
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Réponse de l'imprimeur
                        </p>
                        <p className="mt-0.5 text-xs">{r.printer_response}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

// ============================================================
// Composant — carte imprimeur proposant le produit
// ============================================================
function PrinterOfferCard({
  offer,
}: {
  offer: ReturnType<typeof Object> & {
    id: string;
    printer_id: string;
    printer_slug: string;
    printer_name: string;
    printer_city: string;
    printer_country: string;
    printer_is_premium: boolean;
    printer_logo: string | null;
    min_price: string;
    currency: string;
    standard_lead_time_days: number;
    express_lead_time_days: number;
    is_express_available: boolean;
    rating: number;
    reviews_count: number;
    orders_count: number;
  };
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500/20 to-orange-500/20">
            <Package className="h-6 w-6 text-pink-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate font-semibold">{offer.printer_name || "Imprimeur"}</p>
              {offer.printer_is_premium && (
                <Badge className="bg-pink-500/15 text-pink-600 text-[10px]">
                  <Sparkles className="mr-0.5 h-2.5 w-2.5" /> Premium
                </Badge>
              )}
            </div>
            {(offer.printer_city || offer.printer_country) && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {[offer.printer_city, offer.printer_country].filter(Boolean).join(", ")}
              </p>
            )}
            {offer.rating > 0 && (
              <div className="mt-1 flex items-center gap-1.5">
                <RatingStars value={offer.rating} size={12} />
                <span className="text-[10px] text-muted-foreground">
                  ({offer.reviews_count} avis)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md bg-secondary/30 p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Prix</p>
            <p className="mt-0.5 font-semibold">
              {Number(offer.min_price) > 0
                ? `${Number(offer.min_price).toLocaleString("fr-FR")} ${offer.currency}`
                : "Sur devis"}
            </p>
          </div>
          <div className="rounded-md bg-secondary/30 p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Délai</p>
            <p className="mt-0.5 font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {offer.standard_lead_time_days}j
            </p>
          </div>
          <div className="rounded-md bg-secondary/30 p-2">
            <p className="text-[10px] uppercase text-muted-foreground">Statut</p>
            <p className="mt-0.5 font-semibold text-emerald-600">Disponible</p>
          </div>
        </div>

        {offer.is_express_available && (
          <Badge variant="outline" className="text-[10px]">
            <Zap className="mr-1 h-2.5 w-2.5 text-orange-500" />
            Express possible : {offer.express_lead_time_days}j
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
