"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts, useCategories } from "@/hooks/use-catalog";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CatalogPage() {
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const { data: categories } = useCategories();
  const { data: products, isLoading } = useProducts({ category, search });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Catalogue</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez un produit, configurez-le et recevez des offres en moins de 10 secondes.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit (flyer, affiche, bâche, brochure…)"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={!category ? "default" : "outline"}
          size="sm"
          onClick={() => setCategory(undefined)}
        >
          Toutes
        </Button>
        {categories?.results?.map((c) => (
          <Button
            key={c.id}
            variant={category === c.id ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(c.id)}
          >
            {c.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-72" />)
          : products?.results?.map((p) => (
              <Link key={p.id} href={`/catalog/${p.slug}`}>
                <Card className="group h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative aspect-[4/3] bg-secondary">
                    {p.primary_image ? (
                      <Image src={p.primary_image} alt={p.name} fill className="object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Sparkles className="h-10 w-10" />
                      </div>
                    )}
                    {p.is_featured && (
                      <Badge className="absolute left-3 top-3" variant="default">★ Mis en avant</Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{p.category_name}</p>
                    <h3 className="font-semibold leading-tight">{p.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.short_description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Min. {p.min_quantity} pièces</span>
                      <span className="font-medium text-primary">{p.lead_time_days} j</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>
    </div>
  );
}
