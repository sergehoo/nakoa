"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck, Boxes, CheckCircle2, ChevronRight, Clock, Edit2,
  Filter, Layers, Loader2, Package, Plus, Power, Search, Sparkles,
  Trash2, Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  useMyPrinterProducts, useAvailableCatalogProducts,
  useBulkActivateProducts, useUpdatePrinterProduct, useDeletePrinterProduct,
  type PrinterProduct, type AvailableProduct,
} from "@/hooks/use-printer-products";
import { useCategories } from "@/hooks/use-catalog";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";

// ============================================================================
// Tab 1 — Mes produits actifs
// ============================================================================

function MyProductsTab() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);
  const { data: items, isLoading } = useMyPrinterProducts({
    search: debounced || undefined,
  });
  const list = (items as PrinterProduct[]) ?? [];

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44" />)}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <Card className="surface-premium">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10">
            <Boxes className="h-6 w-6 text-orange-400" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Aucun produit activé</p>
            <p className="text-sm text-muted-foreground">
              Passez à l&apos;onglet <strong>Catalogue Nakoa</strong> pour sélectionner les produits que vous proposez.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans mes produits…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => <MyProductCard key={p.id} item={p} />)}
      </div>
    </div>
  );
}

function MyProductCard({ item }: { item: PrinterProduct }) {
  const update = useUpdatePrinterProduct();
  const remove = useDeletePrinterProduct();

  const toggleActive = async () => {
    try {
      await update.mutateAsync({ id: item.id, payload: { is_active: !item.is_active } });
      toast.success(item.is_active ? "Produit désactivé" : "Produit réactivé");
    } catch {
      toast.error("Échec");
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Retirer « ${item.product_detail?.name} » de vos produits ?`)) return;
    try {
      await remove.mutateAsync(item.id);
      toast.success("Produit retiré");
    } catch {
      toast.error("Échec du retrait");
    }
  };

  return (
    <Card className={cn(
      "surface-premium group transition-all",
      !item.is_active && "opacity-60",
    )}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/5 text-orange-400">
            <Package className="h-5 w-5" />
          </div>
          {item.is_active ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> Actif
            </Badge>
          ) : (
            <Badge variant="secondary">Inactif</Badge>
          )}
        </div>
        <div>
          <CardTitle className="text-base">{item.product_detail?.name}</CardTitle>
          <p className="text-xs text-muted-foreground">{item.product_detail?.category_name}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Prix de base</span>
            <span className="font-mono font-semibold">
              {formatCurrency(Number(item.min_price), item.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Délai standard</span>
            <span>{item.standard_lead_time_days} j</span>
          </div>
          {item.is_express_available && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" /> Express
              </span>
              <span>{item.express_lead_time_days} j (+{item.express_surcharge_pct}%)</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Capacité/jour</span>
            <span>{item.daily_capacity}</span>
          </div>
          {item.orders_count > 0 && (
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground">Commandes</span>
              <span className="font-semibold text-emerald-400">{item.orders_count}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 pt-1">
          <EditDialog item={item} />
          <Button size="sm" variant="ghost" onClick={toggleActive} disabled={update.isPending}>
            <Power className="h-3 w-3" />
          </Button>
          <Button
            size="sm" variant="ghost"
            className="text-destructive"
            onClick={handleRemove}
            disabled={remove.isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EditDialog({ item }: { item: PrinterProduct }) {
  const [open, setOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(item.min_price);
  const [setupCost, setSetupCost] = useState(item.setup_cost);
  const [stdLead, setStdLead] = useState(item.standard_lead_time_days);
  const [expressLead, setExpressLead] = useState(item.express_lead_time_days);
  const [expressSurcharge, setExpressSurcharge] = useState(item.express_surcharge_pct);
  const [dailyCap, setDailyCap] = useState(item.daily_capacity);
  const [expressOn, setExpressOn] = useState(item.is_express_available);
  const [notes, setNotes] = useState(item.notes);
  const update = useUpdatePrinterProduct();

  const submit = async () => {
    try {
      await update.mutateAsync({
        id: item.id,
        payload: {
          min_price: minPrice,
          setup_cost: setupCost,
          standard_lead_time_days: Number(stdLead),
          express_lead_time_days: Number(expressLead),
          express_surcharge_pct: expressSurcharge,
          daily_capacity: Number(dailyCap),
          is_express_available: expressOn,
          notes,
        },
      });
      toast.success("Produit mis à jour");
      setOpen(false);
    } catch {
      toast.error("Échec de la mise à jour");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit2 className="mr-1 h-3 w-3" /> Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item.product_detail?.name}</DialogTitle>
          <DialogDescription>
            Ajustez vos prix, délais et capacités pour ce produit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Prix minimum</Label>
              <Input type="number" step="100" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Frais de calage</Label>
              <Input type="number" step="100" value={setupCost} onChange={(e) => setSetupCost(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Délai standard (j)</Label>
              <Input type="number" value={stdLead} onChange={(e) => setStdLead(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Délai express (j)</Label>
              <Input type="number" value={expressLead} onChange={(e) => setExpressLead(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Surcharge express (%)</Label>
              <Input type="number" value={expressSurcharge} onChange={(e) => setExpressSurcharge(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Capacité journalière</Label>
              <Input type="number" value={dailyCap} onChange={(e) => setDailyCap(Number(e.target.value))} />
            </div>
            <label className="flex items-center gap-2 pt-7 text-sm">
              <input
                type="checkbox" checked={expressOn}
                onChange={(e) => setExpressOn(e.target.checked)}
                className="h-4 w-4"
              />
              Mode express disponible
            </label>
          </div>
          <div className="space-y-2">
            <Label>Notes internes (optionnel)</Label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Précisions techniques, contraintes, mémo…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={update.isPending}>
            {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Tab 2 — Catalogue Nakoa (produits à activer)
// ============================================================================

function CatalogTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const debounced = useDebounce(search, 300);

  const { data: catData } = useCategories();
  const categories = (catData?.results ?? []) as { id: string; name: string; slug: string }[];

  const { data: avail, isLoading } = useAvailableCatalogProducts({
    search: debounced || undefined,
    category: category || undefined,
  });
  const products = avail?.results ?? [];

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkActivate = useBulkActivateProducts();
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  const [defMinPrice, setDefMinPrice] = useState(0);
  const [defCapacity, setDefCapacity] = useState(500);
  const [defLead, setDefLead] = useState(3);

  const confirmActivate = async () => {
    try {
      const res = await bulkActivate.mutateAsync({
        product_ids: Array.from(selected),
        defaults: {
          min_price: defMinPrice,
          daily_capacity: defCapacity,
          standard_lead_time_days: defLead,
          currency: "XOF",
        },
      });
      toast.success(`${res.created} produits ajoutés à votre catalogue`);
      setSelected(new Set());
      setDefaultsOpen(false);
    } catch {
      toast.error("Erreur lors de l'activation");
    }
  };

  const selectedCount = selected.size;

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit (cartes de visite, flyers, bâche…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="md:w-[220px]">
            <Filter className="mr-2 h-3.5 w-3.5" />
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Barre de sélection (sticky) */}
      {selectedCount > 0 && (
        <Card className="surface-premium sticky top-20 z-10 border-orange-500/40">
          <CardContent className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{selectedCount} produit{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}</p>
                <p className="text-xs text-muted-foreground">
                  Définissez des valeurs par défaut puis activez en bloc.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Désélectionner
              </Button>
              <Dialog open={defaultsOpen} onOpenChange={setDefaultsOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1 h-3.5 w-3.5" /> Activer la sélection
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Valeurs par défaut</DialogTitle>
                    <DialogDescription>
                      Appliquées aux {selectedCount} produit{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}.
                      Vous pourrez les ajuster individuellement après.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Prix minimum (XOF)</Label>
                      <Input type="number" value={defMinPrice} onChange={(e) => setDefMinPrice(Number(e.target.value))} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Capacité/jour</Label>
                        <Input type="number" value={defCapacity} onChange={(e) => setDefCapacity(Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Délai standard (jours)</Label>
                        <Input type="number" value={defLead} onChange={(e) => setDefLead(Number(e.target.value))} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setDefaultsOpen(false)}>Annuler</Button>
                    <Button onClick={confirmActivate} disabled={bulkActivate.isPending}>
                      {bulkActivate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Activer {selectedCount}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grille */}
      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-emerald-400" />
            <p className="mt-3 font-semibold">Catalogue complet</p>
            <p className="text-sm text-muted-foreground">
              Vous proposez déjà tous les produits du catalogue Nakoa. Bravo !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <AvailableProductCard
              key={p.id}
              product={p}
              selected={selected.has(p.id)}
              onToggle={() => toggle(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AvailableProductCard({
  product, selected, onToggle,
}: {
  product: AvailableProduct;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card p-4 text-left transition-all",
        "hover:border-orange-500/40 hover:shadow-md hover:shadow-orange-500/10",
        selected && "border-orange-500/60 bg-orange-500/5 ring-1 ring-orange-500/40",
      )}
    >
      {/* Checkbox visuelle */}
      <div className={cn(
        "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded border transition-all",
        selected
          ? "border-orange-500 bg-orange-500 text-white"
          : "border-border bg-background group-hover:border-orange-500/50",
      )}>
        {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
      </div>

      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/5 text-orange-400">
        <Layers className="h-5 w-5" />
      </div>

      <h3 className="font-semibold leading-tight">{product.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {product.short_description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary" className="gap-1">
          <Boxes className="h-3 w-3" /> {product.category.name}
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> {product.lead_time_days}j
        </Badge>
        <Badge variant="secondary">Min. {product.min_quantity}</Badge>
      </div>
    </button>
  );
}

// ============================================================================
// Page principale
// ============================================================================

export default function PrinterProductsPage() {
  const { data: items } = useMyPrinterProducts();
  const myCount = ((items as PrinterProduct[]) ?? []).length;
  const activeCount = ((items as PrinterProduct[]) ?? []).filter((p) => p.is_active).length;
  const { data: avail } = useAvailableCatalogProducts();
  const availCount = avail?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Mes produits</h1>
        <p className="text-sm text-muted-foreground">
          Activez les produits du catalogue Nakoa que vous savez fabriquer, et définissez vos prix &amp; délais.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="surface-premium">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500/15 text-orange-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{myCount}</p>
              <p className="text-xs text-muted-foreground">produits proposés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-premium">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">actifs sur la marketplace</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-premium">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{availCount}</p>
              <p className="text-xs text-muted-foreground">à découvrir dans le catalogue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">
            <Boxes className="mr-2 h-3.5 w-3.5" /> Mes produits ({myCount})
          </TabsTrigger>
          <TabsTrigger value="catalog">
            <Layers className="mr-2 h-3.5 w-3.5" /> Catalogue Nakoa ({availCount})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mine" className="mt-4">
          <MyProductsTab />
        </TabsContent>
        <TabsContent value="catalog" className="mt-4">
          <CatalogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
