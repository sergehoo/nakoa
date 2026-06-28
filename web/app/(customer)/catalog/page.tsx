"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Boxes, Clock, Filter, Flame, Layers, Package,
  Search, Sparkles, Star, TrendingUp, Zap,
} from "lucide-react";

import { useProducts, useCategories } from "@/hooks/use-catalog";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "__all__";

type SortKey = "popular" | "name" | "lead_time" | "min_quantity";

const SORT_LABELS: Record<SortKey, string> = {
  popular: "Plus populaires",
  name: "Nom (A-Z)",
  lead_time: "Délai croissant",
  min_quantity: "Quantité min. croissante",
};

export default function CatalogPage() {
  const [category, setCategory] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const debounced = useDebounce(search, 300);

  const { data: categories } = useCategories();
  const cats = categories?.results ?? [];

  const { data: products, isLoading } = useProducts({
    category: category === ALL ? undefined : category,
    search: debounced || undefined,
    page_size: 60,
  });

  const sorted = useMemo(() => {
    const list = products?.results ? [...products.results] : [];
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "lead_time") return (a.lead_time_days ?? 99) - (b.lead_time_days ?? 99);
      if (sort === "min_quantity") return (a.min_quantity ?? 0) - (b.min_quantity ?? 0);
      // popular : featured d'abord, puis par nom
      const af = a.is_featured ? 1 : 0;
      const bf = b.is_featured ? 1 : 0;
      if (af !== bf) return bf - af;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [products, sort]);

  const totalCount = products?.count ?? 0;

  return (
    <div className="space-y-8">
      {/* Hero marketplace */}
      <section className="hero-mesh relative overflow-hidden rounded-2xl border p-8 lg:p-10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/5 px-3 py-1 text-xs">
            <Sparkles className="h-3 w-3 text-orange-400" />
            <span className="font-medium">Catalogue Nakoa</span>
            <span className="text-muted-foreground">— {totalCount} produits disponibles</span>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight lg:text-5xl">
            Trouvez le bon produit, <span className="text-gradient-electric">le bon imprimeur</span>.
          </h1>
          <p className="text-base text-muted-foreground lg:text-lg">
            Des cartes de visite aux bâches grand format. Comparez les offres de dizaines
            d&apos;imprimeurs partenaires, payez en Mobile Money, recevez chez vous.
          </p>

          {/* Recherche premium */}
          <div className="mt-5 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cartes de visite, flyers, bâches, t-shirts…"
                className="h-14 pl-12 text-base"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              💡 Tapez ce que vous cherchez en français — notre IA fait correspondre les produits.
            </p>
          </div>
        </div>
      </section>

      {/* Filtres horizontaux + sort */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={category === ALL ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(ALL)}
            className="rounded-full"
          >
            <Layers className="mr-1.5 h-3 w-3" /> Toutes ({totalCount})
          </Button>
          {cats.map((c) => (
            <Button
              key={c.id}
              variant={category === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(c.id)}
              className="rounded-full"
            >
              {c.name}
            </Button>
          ))}

          {/* Sort */}
          <div className="ml-auto">
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-9 w-[200px]">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Indicateur résultats */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{sorted.length}</strong> produit{sorted.length > 1 ? "s" : ""}
            {category !== ALL && cats.find((c) => c.id === category) && (
              <> dans <strong className="text-foreground">{cats.find((c) => c.id === category)?.name}</strong></>
            )}
            {debounced && <> pour « {debounced} »</>}
          </p>
        )}
      </div>

      {/* Grille produits */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      ) : sorted.length === 0 ? (
        <Card className="surface-premium">
          <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/5">
              <Search className="h-7 w-7 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold">Aucun produit ne correspond</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Essayez d&apos;élargir votre recherche, ou contactez-nous pour ajouter ce produit
                à notre catalogue.
              </p>
            </div>
            <Button variant="outline" onClick={() => { setSearch(""); setCategory(ALL); }}>
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Card produit premium
// ============================================================================

function ProductCard({ product }: { product: Awaited<ReturnType<typeof useProducts>>["data"] extends { results: (infer T)[] } ? T : never }) {
  return (
    <Link href={`/catalog/${product.slug}`} className="group block">
      <Card
        className={cn(
          "h-full overflow-hidden border-border/60 transition-all",
          "hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10",
        )}
      >
        {/* Visuel */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-rose-500/5">
          {product.primary_image ? (
            <Image
              src={product.primary_image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Boxes className="h-16 w-16 text-orange-400/30" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1">
            {product.is_featured && (
              <Badge className="gap-1 bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md backdrop-blur">
                <Flame className="h-3 w-3" /> Populaire
              </Badge>
            )}
          </div>

          {/* Indicateur "Voir" au hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex translate-y-2 items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-foreground transition-transform group-hover:translate-y-0">
              Configurer <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Contenu */}
        <CardContent className="p-4">
          {product.category_name && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {product.category_name}
            </p>
          )}
          <h3 className="mt-0.5 font-semibold leading-tight">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {product.short_description ?? ""}
          </p>

          {/* Stats */}
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" /> Min. {product.min_quantity ?? 1}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {product.lead_time_days ?? 3}j
              </span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-orange-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
