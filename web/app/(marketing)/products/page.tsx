"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { useCategories, useProducts } from "@/hooks/use-catalog";
import { useDebounce } from "@/hooks/use-debounce";

const ALL = "__all__";

function ProductsBrowser() {
  const router = useRouter();
  const sp = useSearchParams();

  const [search, setSearch] = useState(sp.get("q") ?? "");
  const [category, setCategory] = useState(sp.get("category") ?? ALL);
  const [ordering, setOrdering] = useState(sp.get("ordering") ?? "-is_featured,name");

  const debouncedSearch = useDebounce(search, 300);

  const { data: cats } = useCategories();
  const categories = cats?.results ?? [];

  const { data, isLoading } = useProducts({
    category: category === ALL ? undefined : category,
    search: debouncedSearch || undefined,
    ordering,
    page_size: 24,
  });

  const products = data?.results ?? [];
  const total = data?.count ?? 0;

  return (
    <>
      <MarketingHeader />
      <div className="container py-12">
        <div className="mb-8 space-y-3">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Catalogue d'impression
        </h1>
        <p className="text-muted-foreground">
          {total > 0
            ? `${total} produit${total > 1 ? "s" : ""} disponible${total > 1 ? "s" : ""}`
            : "Explorez notre catalogue complet"}
        </p>
      </div>

      {/* Filtres */}
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit (carte de visite, flyer, t-shirt…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Toutes catégories" />
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

        <Select value={ordering} onValueChange={setOrdering}>
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

        {(category !== ALL || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setCategory(ALL);
              router.replace("/products");
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Grille */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary/30" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-secondary/20 py-16 text-center">
          <p className="text-lg font-medium">Aucun produit trouvé</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Essaie d'élargir tes critères de recherche.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        )}
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container py-12">Chargement…</div>}>
      <ProductsBrowser />
    </Suspense>
  );
}
