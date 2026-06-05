"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle, Boxes, CheckCircle2, ChevronLeft, ChevronRight,
  Edit2, Filter, Loader2, Package, Plus, Search, Star, Trash2,
  Upload, XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAdminCategories, useSaveAdminCategory, useDeleteAdminCategory,
  useAdminProducts, useAdminCatalogStats, useSaveAdminProduct, useDeleteAdminProduct,
  useImportCatalogCsv,
  type AdminCategory, type AdminProduct,
} from "@/hooks/use-admin-catalog";
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

// ============================================================================
// Tab 1 — Produits
// ============================================================================

const ALL = "__all__";

function ProductsTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<typeof ALL | "active" | "inactive" | "uncovered">(ALL);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data: catData } = useAdminCategories();
  const categories = (catData?.results ?? []) as AdminCategory[];

  const { data, isLoading } = useAdminProducts({
    page,
    page_size: 25,
    search: debouncedSearch || undefined,
    category: category === ALL ? undefined : category,
    is_active: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
    uncovered: statusFilter === "uncovered" ? true : undefined,
  });

  const products = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="md:w-[200px]">
            <Filter className="mr-2 h-3.5 w-3.5" />
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Toutes catégories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as never); setPage(1); }}>
          <SelectTrigger className="md:w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
            <SelectItem value="uncovered">Sans imprimeur</SelectItem>
          </SelectContent>
        </Select>
        <ProductDialog
          categories={categories}
          trigger={
            <Button><Plus className="mr-2 h-4 w-4" /> Nouveau produit</Button>
          }
        />
      </div>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {total} produit{total > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Aucun produit ne correspond aux filtres.
            </div>
          ) : (
            <div className="divide-y">
              {products.map((p) => (
                <ProductRow key={p.id} product={p} categories={categories} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} · {total} résultats
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Précédent
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Suivant <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, categories }: { product: AdminProduct; categories: AdminCategory[] }) {
  const save = useSaveAdminProduct();
  const del = useDeleteAdminProduct();
  const cat = categories.find((c) => c.id === product.category);

  const toggleActive = async () => {
    try {
      await save.mutateAsync({ id: product.id, payload: { is_active: !product.is_active } });
      toast.success(product.is_active ? "Désactivé" : "Activé");
    } catch {
      toast.error("Échec");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement « ${product.name} » ?`)) return;
    try {
      await del.mutateAsync(product.id);
      toast.success("Produit supprimé");
    } catch {
      toast.error("Impossible de supprimer (peut-être référencé par des commandes)");
    }
  };

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/5 text-orange-400">
        <Package className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{product.name}</p>
          {product.is_featured && (
            <Badge variant="default" className="text-[10px]"><Star className="mr-0.5 h-2.5 w-2.5" /> Mis en avant</Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {cat?.name ?? "—"} · {product.short_description || "Pas de description"}
        </p>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <Badge variant="secondary" className="gap-1">
          <Boxes className="h-3 w-3" /> Min {product.min_quantity}
        </Badge>
        {(product.printers_count ?? 0) > 0 ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> {product.printers_count} imprimeur{(product.printers_count ?? 0) > 1 ? "s" : ""}
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> Sans imprimeur
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm" variant={product.is_active ? "ghost" : "outline"}
          onClick={toggleActive} disabled={save.isPending}
        >
          {product.is_active ? "Actif" : "Inactif"}
        </Button>
        <ProductDialog
          categories={categories} initial={product}
          trigger={<Button size="icon" variant="ghost"><Edit2 className="h-3.5 w-3.5" /></Button>}
        />
        <Button
          size="icon" variant="ghost" className="text-destructive"
          onClick={handleDelete} disabled={del.isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ProductDialog({
  categories, initial, trigger,
}: {
  categories: AdminCategory[];
  initial?: AdminProduct;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? (categories[0]?.id ?? ""));
  const [shortDesc, setShortDesc] = useState(initial?.short_description ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [minQty, setMinQty] = useState(initial?.min_quantity ?? 1);
  const [leadTime, setLeadTime] = useState(initial?.lead_time_days ?? 3);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(", "));

  const save = useSaveAdminProduct();

  const submit = async () => {
    if (!name || !category) {
      toast.error("Nom et catégorie requis");
      return;
    }
    try {
      await save.mutateAsync({
        id: initial?.id,
        payload: {
          name,
          category,
          short_description: shortDesc,
          description,
          min_quantity: Number(minQty),
          lead_time_days: Number(leadTime),
          is_featured: isFeatured,
          tags: tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
        },
      });
      toast.success(initial ? "Produit mis à jour" : "Produit créé");
      setOpen(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail ?? "Échec de l'enregistrement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier le produit" : "Nouveau produit catalogue"}</DialogTitle>
          <DialogDescription>
            Ce produit sera proposé à tous les imprimeurs qui pourront l&apos;activer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cartes de visite premium" />
            </div>
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description courte</Label>
            <Input
              value={shortDesc} onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Une phrase qui résume le produit"
            />
          </div>

          <div className="space-y-2">
            <Label>Description complète</Label>
            <textarea
              rows={4}
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Détails techniques, usages, avantages…"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Quantité min.</Label>
              <Input type="number" value={minQty} onChange={(e) => setMinQty(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Délai estimé (jours)</Label>
              <Input type="number" value={leadTime} onChange={(e) => setLeadTime(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags (séparés par virgules)</Label>
            <Input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="papier, A5, recto-verso" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4"
            />
            Mettre en avant ce produit
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initial ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Tab 2 — Catégories
// ============================================================================

function CategoriesTab() {
  const { data, isLoading } = useAdminCategories();
  const categories = (data as { results: AdminCategory[] } | undefined)?.results ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CategoryDialog trigger={<Button><Plus className="mr-2 h-4 w-4" /> Nouvelle catégorie</Button>} />
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category }: { category: AdminCategory }) {
  const save = useSaveAdminCategory();
  const del = useDeleteAdminCategory();

  const handleToggle = async () => {
    try {
      await save.mutateAsync({ id: category.id, payload: { is_active: !category.is_active } });
      toast.success(category.is_active ? "Désactivée" : "Activée");
    } catch {
      toast.error("Échec");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer la catégorie « ${category.name} » ?`)) return;
    try {
      await del.mutateAsync(category.id);
      toast.success("Catégorie supprimée");
    } catch {
      toast.error("Impossible (catégorie contenant des produits)");
    }
  };

  return (
    <Card className="surface-premium">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{category.name}</CardTitle>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {category.description || "Pas de description"}
            </p>
          </div>
          <Badge variant={category.is_active ? "success" : "secondary"}>
            {category.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Produits</span>
          <span className="font-semibold">{category.products_count ?? 0}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={handleToggle} disabled={save.isPending}>
            {category.is_active ? "Désactiver" : "Activer"}
          </Button>
          <CategoryDialog
            initial={category}
            trigger={<Button size="icon" variant="ghost"><Edit2 className="h-3.5 w-3.5" /></Button>}
          />
          <Button
            size="icon" variant="ghost" className="ml-auto text-destructive"
            onClick={handleDelete} disabled={del.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryDialog({ initial, trigger }: { initial?: AdminCategory; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [position, setPosition] = useState(initial?.position ?? 0);
  const save = useSaveAdminCategory();

  const submit = async () => {
    if (!name) { toast.error("Nom requis"); return; }
    try {
      await save.mutateAsync({
        id: initial?.id,
        payload: {
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          description,
          position: Number(position),
        },
      });
      toast.success(initial ? "Catégorie mise à jour" : "Catégorie créée");
      setOpen(false);
    } catch {
      toast.error("Échec");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slug (optionnel)</Label>
            <Input
              value={slug} onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-généré à partir du nom"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Ordre d&apos;affichage</Label>
            <Input type="number" value={position} onChange={(e) => setPosition(Number(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initial ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Import CSV
// ============================================================================

function ImportCsvCard() {
  const importCsv = useImportCatalogCsv();
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ created: number; updated: number; errors: { line: number; error: string }[] } | null>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importCsv.mutateAsync(file);
      setResult(res);
      toast.success(`${res.created} créés · ${res.updated} mis à jour · ${res.errors.length} erreurs`);
    } catch {
      toast.error("Import échoué");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card className="surface-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-orange-400" /> Import CSV en masse
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Format attendu : <code>name, category_slug, short_description, min_quantity, lead_time_days, tags</code>
          {" "}(tags séparés par <code>|</code>)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef} type="file" accept=".csv,text/csv"
          onChange={handleImport} className="hidden"
        />
        <Button
          variant="outline" className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={importCsv.isPending}
        >
          {importCsv.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Choisir un fichier CSV
        </Button>

        {result && (
          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> {result.created} créés
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
              <CheckCircle2 className="h-4 w-4" /> {result.updated} mis à jour
            </div>
            {result.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" /> {result.errors.length} erreurs
                </div>
                <ul className="ml-6 space-y-1 text-xs text-muted-foreground">
                  {result.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>Ligne {e.line} : {e.error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>… et {result.errors.length - 5} autres</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium">Exemple de fichier</summary>
          <pre className="mt-2 rounded bg-muted p-2 font-mono text-[10px] leading-tight">
{`name,category_slug,short_description,min_quantity,lead_time_days,tags
Cartes Premium,impression-papier,Cartes 400g pelliculage mat,100,5,premium|350g`}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Page principale
// ============================================================================

export default function AdminCatalogPage() {
  const { data: stats } = useAdminCatalogStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Catalogue Nakoa</h1>
        <p className="text-sm text-muted-foreground">
          Gérez les catégories et produits proposés à tous les imprimeurs de la marketplace.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="surface-premium">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500/15 text-orange-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{stats?.total_products ?? "—"}</p>
              <p className="text-xs text-muted-foreground">produits au total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-premium">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{stats?.active_products ?? "—"}</p>
              <p className="text-xs text-muted-foreground">actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-premium">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{stats?.uncovered_products ?? "—"}</p>
              <p className="text-xs text-muted-foreground">sans imprimeur</p>
            </div>
          </CardContent>
        </Card>
        <Card className="surface-premium">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{stats?.categories.length ?? "—"}</p>
              <p className="text-xs text-muted-foreground">catégories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="mr-2 h-3.5 w-3.5" /> Produits
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Boxes className="mr-2 h-3.5 w-3.5" /> Catégories
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="mr-2 h-3.5 w-3.5" /> Import CSV
          </TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-4">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="import" className="mt-4">
          <ImportCsvCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
