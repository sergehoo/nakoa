"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Filter, RotateCcw, Search, Star, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductCard } from "@/components/shop/product-card";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { useCategories, useProducts } from "@/hooks/use-catalog";
import { useDebounce } from "@/hooks/use-debounce";

const ALL = "__all__";

type Filters = {
  search: string;
  category: string;
  price_min: string;
  price_max: string;
  rating_min: string;
  lead_time_max: string;
  in_stock: boolean;
  ordering: string;
};

const DEFAULT_FILTERS: Filters = {
  search: "",
  category: ALL,
  price_min: "",
  price_max: "",
  rating_min: "",
  lead_time_max: "",
  in_stock: false,
  ordering: "-is_featured,name",
};

function ProductsBrowser() {
  const router = useRouter();
  const sp = useSearchParams();

  const [filters, setFilters] = useState<Filters>({
    search: sp.get("q") ?? DEFAULT_FILTERS.search,
    category: sp.get("category") ?? DEFAULT_FILTERS.category,
    price_min: sp.get("price_min") ?? DEFAULT_FILTERS.price_min,
    price_max: sp.get("price_max") ?? DEFAULT_FILTERS.price_max,
    rating_min: sp.get("rating_min") ?? DEFAULT_FILTERS.rating_min,
    lead_time_max: sp.get("lead_time_max") ?? DEFAULT_FILTERS.lead_time_max,
    in_stock: sp.get("in_stock") === "1",
    ordering: sp.get("ordering") ?? DEFAULT_FILTERS.ordering,
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 300);

  const { data: cats } = useCategories();
  const categories = cats?.results ?? [];

  const { data, isLoading } = useProducts({
    search: debouncedSearch || undefined,
    category: filters.category === ALL ? undefined : filters.category,
    price_min: filters.price_min || undefined,
    price_max: filters.price_max || undefined,
    rating_min: filters.rating_min || undefined,
    lead_time_max: filters.lead_time_max || undefined,
    in_stock: filters.in_stock || undefined,
    ordering: filters.ordering,
    page_size: 24,
  });

  const products = data?.results ?? [];
  const total = data?.count ?? 0;

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const reset = () => {
    setFilters({ ...DEFAULT_FILTERS });
    router.replace("/products");
  };

  // Compteur de filtres actifs (hors ordering/search)
  const activeCount =
    (filters.category !== ALL ? 1 : 0) +
    (filters.price_min ? 1 : 0) +
    (filters.price_max ? 1 : 0) +
    (filters.rating_min ? 1 : 0) +
    (filters.lead_time_max ? 1 : 0) +
    (filters.in_stock ? 1 : 0);

  return (
    <>
      <MarketingHeader />
      <div className="container py-8">
        <div className="mb-6 space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Catalogue d'impression
          </h1>
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `${total} produit${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}`
              : "Explore notre catalogue complet"}
          </p>
        </div>

        {/* Bar du haut : recherche + tri + bouton filtres mobile */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher (carte de visite, flyer, t-shirt…)"
              value={filters.search}
              onChange={(e) => update("search", e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filters.ordering} onValueChange={(v) => update("ordering", v)}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-is_featured,name">Recommandés</SelectItem>
              <SelectItem value="name">Nom A–Z</SelectItem>
              <SelectItem value="-name">Nom Z–A</SelectItem>
              <SelectItem value="lead_time_days">Délai court</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden"
          >
            <Filter className="mr-1.5 h-4 w-4" />
            Filtres
            {activeCount > 0 && (
              <Badge className="ml-1 h-4 min-w-[16px] px-1 text-[10px]">{activeCount}</Badge>
            )}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* Sidebar filtres — collapsible sur mobile */}
          <aside
            className={`${mobileOpen ? "block" : "hidden"} md:block`}
          >
            <Card>
              <CardContent className="space-y-5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Filtres
                  </p>
                  {activeCount > 0 && (
                    <Button
                      variant="ghost" size="sm"
                      onClick={reset}
                      className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="mr-1 h-3 w-3" /> Réinit.
                    </Button>
                  )}
                </div>

                {/* Catégorie */}
                <div>
                  <Label className="mb-1.5 block text-xs">Catégorie</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(v) => update("category", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>Toutes catégories</SelectItem>
                      {categories
                        .filter((c) => c.slug && c.name)
                        .map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fourchette de prix */}
                <div>
                  <Label className="mb-1.5 block text-xs">Prix (XOF)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.price_min}
                      onChange={(e) => update("price_min", e.target.value)}
                      className="text-sm"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.price_max}
                      onChange={(e) => update("price_max", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Délai max */}
                <div>
                  <Label className="mb-1.5 block text-xs">Délai max (jours)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 5"
                    value={filters.lead_time_max}
                    onChange={(e) => update("lead_time_max", e.target.value)}
                  />
                </div>

                {/* Note minimum */}
                <div>
                  <Label className="mb-1.5 block text-xs">Note minimum</Label>
                  <div className="grid grid-cols-5 gap-1">
                    {[0, 2, 3, 4, 4.5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update("rating_min", n === 0 ? "" : String(n))}
                        className={`flex items-center justify-center gap-0.5 rounded-md border py-1.5 text-xs transition ${
                          (n === 0 && !filters.rating_min) ||
                          String(n) === filters.rating_min
                            ? "border-amber-500 bg-amber-500/10 text-amber-600"
                            : "hover:border-amber-500/50"
                        }`}
                      >
                        {n === 0 ? (
                          "Toutes"
                        ) : (
                          <>
                            <Star className="h-3 w-3 fill-current" /> {n}+
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disponibilité */}
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.in_stock}
                    onChange={(e) => update("in_stock", e.target.checked)}
                    className="h-4 w-4 rounded accent-pink-500"
                  />
                  <span>Disponible (au moins un imprimeur actif)</span>
                </label>
              </CardContent>
            </Card>

            {/* Récap badges filtres actifs */}
            {activeCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {filters.category !== ALL && (
                  <FilterBadge
                    label={categories.find((c) => c.slug === filters.category)?.name ?? filters.category}
                    onClear={() => update("category", ALL)}
                  />
                )}
                {filters.price_min && (
                  <FilterBadge label={`≥ ${filters.price_min} XOF`} onClear={() => update("price_min", "")} />
                )}
                {filters.price_max && (
                  <FilterBadge label={`≤ ${filters.price_max} XOF`} onClear={() => update("price_max", "")} />
                )}
                {filters.lead_time_max && (
                  <FilterBadge label={`Délai ≤ ${filters.lead_time_max}j`} onClear={() => update("lead_time_max", "")} />
                )}
                {filters.rating_min && (
                  <FilterBadge label={`${filters.rating_min}+ étoiles`} onClear={() => update("rating_min", "")} />
                )}
                {filters.in_stock && (
                  <FilterBadge label="Disponible" onClear={() => update("in_stock", false)} />
                )}
              </div>
            )}
          </aside>

          {/* Grille produits */}
          <div>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary/30" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-secondary/20 py-20 text-center">
                <p className="text-lg font-medium">Aucun produit ne correspond</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Essaie d'élargir tes critères ou{" "}
                  <button onClick={reset} className="text-primary underline">
                    réinitialise les filtres
                  </button>
                  .
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function FilterBadge({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Badge variant="outline" className="gap-1 pr-1">
      {label}
      <button type="button" onClick={onClear} className="rounded-full p-0.5 hover:bg-secondary">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container py-12">Chargement…</div>}>
      <ProductsBrowser />
    </Suspense>
  );
}
