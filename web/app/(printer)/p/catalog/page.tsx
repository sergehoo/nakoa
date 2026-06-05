"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronRight, Edit2, Loader2, Package, Plus, Power, Trash2, TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

import {
  usePriceGrids, useSavePriceGrid, useDeletePriceGrid,
  useSavePriceTier, useDeletePriceTier,
  type PriceGrid, type PriceTier,
} from "@/hooks/use-printer";
import { useProducts } from "@/hooks/use-catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

const gridSchema = z.object({
  product: z.string().min(1, "Produit requis"),
  currency: z.string().min(2),
  base_setup_cost: z.coerce.number().min(0),
  base_unit_cost: z.coerce.number().min(0),
  vat_rate: z.coerce.number().min(0).max(50),
  is_active: z.boolean().optional(),
});
type GridForm = z.infer<typeof gridSchema>;

const tierSchema = z.object({
  min_quantity: z.coerce.number().int().min(1),
  max_quantity: z.coerce.number().int().min(1).optional().or(z.literal("")),
  unit_price: z.coerce.number().min(0),
  discount_pct: z.coerce.number().min(0).max(100),
});
type TierForm = z.infer<typeof tierSchema>;

function GridDialog({
  trigger,
  initial,
  onSubmit,
  loading,
}: {
  trigger: React.ReactNode;
  initial?: PriceGrid;
  onSubmit: (data: GridForm) => Promise<void>;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: productsData } = useProducts({ page_size: 100 });
  const products = (productsData as { results?: { id: string; name: string }[] } | undefined)?.results ?? [];

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<GridForm>({
    resolver: zodResolver(gridSchema),
    defaultValues: initial ? {
      product: initial.product,
      currency: initial.currency,
      base_setup_cost: Number(initial.base_setup_cost),
      base_unit_cost: Number(initial.base_unit_cost),
      vat_rate: Number(initial.vat_rate),
      is_active: initial.is_active,
    } : {
      currency: "XOF",
      base_setup_cost: 0,
      base_unit_cost: 0,
      vat_rate: 18,
      is_active: true,
    },
  });

  const submit = async (data: GridForm) => {
    await onSubmit(data);
    setOpen(false);
    if (!initial) reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier la grille" : "Nouvelle grille tarifaire"}</DialogTitle>
          <DialogDescription>
            Définissez vos coûts de base. Vous pourrez ajouter des paliers de remise ensuite.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {!initial && (
            <div className="space-y-2">
              <Label>Produit</Label>
              <Select
                value={watch("product")}
                onValueChange={(v) => setValue("product", v, { shouldDirty: true })}
              >
                <SelectTrigger><SelectValue placeholder="Choisir un produit" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product && <p className="text-xs text-destructive">{errors.product.message}</p>}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="base_setup_cost">Frais de calage</Label>
              <Input id="base_setup_cost" type="number" step="0.01" {...register("base_setup_cost")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_unit_cost">Coût unitaire de base</Label>
              <Input id="base_unit_cost" type="number" step="0.0001" {...register("base_unit_cost")} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vat_rate">TVA (%)</Label>
              <Input id="vat_rate" type="number" step="0.01" {...register("vat_rate")} />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Select
                value={watch("currency")}
                onValueChange={(v) => setValue("currency", v, { shouldDirty: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF</SelectItem>
                  <SelectItem value="XAF">XAF</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initial ? "Mettre à jour" : "Créer la grille"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TierDialog({
  trigger,
  gridId,
  initial,
  onSaved,
}: {
  trigger: React.ReactNode;
  gridId: string;
  initial?: PriceTier;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const save = useSavePriceTier();

  const {
    register, handleSubmit, reset,
    formState: { errors },
  } = useForm<TierForm>({
    resolver: zodResolver(tierSchema),
    defaultValues: initial ? {
      min_quantity: initial.min_quantity,
      max_quantity: initial.max_quantity ?? undefined,
      unit_price: Number(initial.unit_price),
      discount_pct: Number(initial.discount_pct),
    } : { min_quantity: 1, unit_price: 0, discount_pct: 0 },
  });

  const submit = async (data: TierForm) => {
    try {
      await save.mutateAsync({
        id: initial?.id,
        payload: {
          ...data,
          grid: gridId,
          max_quantity: data.max_quantity === "" ? null : Number(data.max_quantity),
        } as Partial<PriceTier>,
      });
      toast.success(initial ? "Palier mis à jour" : "Palier ajouté");
      setOpen(false);
      reset();
      onSaved();
    } catch {
      toast.error("Impossible d'enregistrer le palier");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier le palier" : "Nouveau palier"}</DialogTitle>
          <DialogDescription>
            À partir de quelle quantité ce prix s&apos;applique-t-il ?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_quantity">Quantité min</Label>
              <Input id="min_quantity" type="number" {...register("min_quantity")} />
              {errors.min_quantity && <p className="text-xs text-destructive">{errors.min_quantity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_quantity">Quantité max (optionnel)</Label>
              <Input id="max_quantity" type="number" {...register("max_quantity")} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit_price">Prix unitaire</Label>
              <Input id="unit_price" type="number" step="0.0001" {...register("unit_price")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_pct">Remise (%)</Label>
              <Input id="discount_pct" type="number" step="0.01" {...register("discount_pct")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GridRow({ grid, refresh }: { grid: PriceGrid; refresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const save = useSavePriceGrid();
  const del = useDeletePriceGrid();
  const delTier = useDeletePriceTier();

  const toggleActive = async () => {
    try {
      await save.mutateAsync({ id: grid.id, payload: { is_active: !grid.is_active } });
      toast.success(grid.is_active ? "Grille désactivée" : "Grille activée");
    } catch {
      toast.error("Impossible de basculer le statut");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette grille et tous ses paliers ?")) return;
    try {
      await del.mutateAsync(grid.id);
      toast.success("Grille supprimée");
    } catch {
      toast.error("Impossible de supprimer");
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm("Supprimer ce palier ?")) return;
    try {
      await delTier.mutateAsync(tierId);
      toast.success("Palier supprimé");
    } catch {
      toast.error("Impossible de supprimer le palier");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex flex-1 items-center gap-3 text-left"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">
                {grid.product_detail?.name ?? `Produit ${grid.product.slice(0, 8)}`}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Base : {formatCurrency(Number(grid.base_unit_cost), grid.currency)}/u
                · Setup : {formatCurrency(Number(grid.base_setup_cost), grid.currency)}
                · TVA {grid.vat_rate}%
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Badge variant={grid.is_active ? "success" : "secondary"}>
              {grid.is_active ? "Active" : "Inactive"}
            </Badge>
            <Button size="sm" variant="ghost" onClick={toggleActive} disabled={save.isPending}>
              <Power className="h-3.5 w-3.5" />
            </Button>
            <GridDialog
              trigger={<Button size="sm" variant="ghost"><Edit2 className="h-3.5 w-3.5" /></Button>}
              initial={grid}
              onSubmit={async (data) => {
                try {
                  await save.mutateAsync({ id: grid.id, payload: data as Partial<PriceGrid> });
                  toast.success("Grille mise à jour");
                } catch {
                  toast.error("Échec de la mise à jour");
                }
              }}
              loading={save.isPending}
            />
            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Paliers de remise</p>
            <TierDialog
              gridId={grid.id}
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="mr-1 h-3 w-3" /> Palier
                </Button>
              }
              onSaved={refresh}
            />
          </div>

          {(grid.tiers ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun palier. Le prix unitaire de base s&apos;appliquera.
            </p>
          ) : (
            <div className="space-y-2">
              {(grid.tiers ?? []).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>{t.min_quantity}</strong>
                      {t.max_quantity ? <> – {t.max_quantity}</> : "+"} unités
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {formatCurrency(Number(t.unit_price), grid.currency)}/u
                    </span>
                    {Number(t.discount_pct) > 0 && (
                      <Badge variant="success" className="text-[10px]">
                        −{t.discount_pct}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <TierDialog
                      gridId={grid.id}
                      initial={t}
                      trigger={<Button size="icon" variant="ghost"><Edit2 className="h-3 w-3" /></Button>}
                      onSaved={refresh}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteTier(t.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function PrinterCatalogPage() {
  const { data: grids, isLoading, refetch } = usePriceGrids();
  const save = useSavePriceGrid();
  const list = (grids as PriceGrid[] | undefined) ?? [];

  const handleCreate = async (data: GridForm) => {
    try {
      await save.mutateAsync({ payload: data as Partial<PriceGrid> });
      toast.success("Grille créée");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string; product?: string[] } } };
      toast.error("Impossible de créer la grille", {
        description: err?.response?.data?.detail ?? err?.response?.data?.product?.[0],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Catalogue & prix</h1>
          <p className="text-sm text-muted-foreground">
            Définissez les produits que vous imprimez et vos grilles tarifaires.
            Chaque grille peut avoir plusieurs paliers de remise.
          </p>
        </div>
        <GridDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle grille
            </Button>
          }
          onSubmit={handleCreate}
          loading={save.isPending}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Aucune grille tarifaire</p>
              <p className="text-sm text-muted-foreground">
                Créez votre première grille pour commencer à recevoir des demandes de devis.
              </p>
            </div>
            <GridDialog
              trigger={<Button><Plus className="mr-2 h-4 w-4" /> Créer une grille</Button>}
              onSubmit={handleCreate}
              loading={save.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((g) => (
            <GridRow key={g.id} grid={g} refresh={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}
