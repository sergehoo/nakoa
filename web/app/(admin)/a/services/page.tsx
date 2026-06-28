"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminServices,
  useCreateService,
  useDeleteService,
  useServiceCategories,
  useUpdateService,
  type PremiumService,
} from "@/hooks/use-premium-services";
import { formatCurrency } from "@/lib/utils";

const EMPTY_SERVICE: Partial<PremiumService> = {
  code: "",
  name: "",
  short_description: "",
  description: "",
  pricing_type: "fixed",
  base_price: "0",
  percentage: "0",
  currency: "XOF",
  is_active: true,
  is_visible: true,
  is_required: false,
  estimated_hours: 0,
  applies_to_categories: [],
  sort_order: 100,
};

export default function AdminServicesPage() {
  const { data: services, isLoading } = useAdminServices();
  const { data: categories } = useServiceCategories();
  const [editing, setEditing] = useState<Partial<PremiumService> | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Services premium
        </h1>
        <p className="text-sm text-muted-foreground">
          Add-ons vendables avec les commandes : correction graphique, BAT pro, vectorisation, IA…
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {services?.length ?? 0} service(s) configuré(s).
        </p>
        <Button onClick={() => { setEditing({ ...EMPTY_SERVICE }); setOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Nouveau service
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : !services || services.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun service. Lance{" "}
            <code className="rounded bg-secondary px-1.5">manage.py seed_premium_services</code>{" "}
            pour démarrer.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <ServiceRow
              key={s.id}
              service={s}
              onEdit={() => { setEditing(s); setOpen(true); }}
            />
          ))}
        </div>
      )}

      <ServiceDialog
        open={open}
        onOpenChange={setOpen}
        service={editing}
        categories={categories ?? []}
      />
    </div>
  );
}

function ServiceRow({
  service, onEdit,
}: { service: PremiumService; onEdit: () => void }) {
  const del = useDeleteService();
  const priceLabel =
    service.pricing_type === "percentage"
      ? `${(Number(service.percentage) * 100).toFixed(1)}%`
      : service.pricing_type === "variable"
        ? "Variable"
        : service.pricing_type === "per_unit"
          ? `${formatCurrency(Number(service.base_price))}/unité`
          : formatCurrency(Number(service.base_price));

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <p className="font-semibold">{service.name}</p>
            <Badge variant={service.is_active ? "default" : "secondary"} className="text-[10px]">
              {service.is_active ? "actif" : "inactif"}
            </Badge>
            {!service.is_visible && (
              <Badge variant="outline" className="text-[10px]">caché</Badge>
            )}
            {service.is_required && (
              <Badge className="bg-orange-500/15 text-orange-600 text-[10px]">requis</Badge>
            )}
            <Badge variant="outline" className="text-[10px]">{service.pricing_type_label}</Badge>
            <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
              {service.code}
            </code>
          </div>
          {service.short_description && (
            <p className="mt-1 text-xs text-muted-foreground">{service.short_description}</p>
          )}
          <p className="mt-1 text-xs">
            <span className="text-muted-foreground">Prix :</span>{" "}
            <span className="font-medium">{priceLabel} {service.currency}</span>
            {service.estimated_hours > 0 && (
              <span className="text-muted-foreground"> · +{service.estimated_hours}h</span>
            )}
            {service.category_name && (
              <span className="text-muted-foreground"> · {service.category_name}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>Éditer</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Supprimer le service "${service.name}" ?`)) {
                del.mutate(service.id, {
                  onSuccess: () => toast.success("Service supprimé"),
                  onError: () => toast.error("Échec de la suppression"),
                });
              }
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceDialog({
  open, onOpenChange, service, categories,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  service: Partial<PremiumService> | null;
  categories: { id: string; name: string }[];
}) {
  const create = useCreateService();
  const update = useUpdateService();
  const [form, setForm] = useState<Partial<PremiumService>>(service ?? EMPTY_SERVICE);

  useMemo(() => {
    if (open) setForm(service ?? EMPTY_SERVICE);
  }, [open, service]);

  const set = <K extends keyof PremiumService>(key: K, value: PremiumService[K] | Partial<PremiumService>[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    try {
      if (service?.id) {
        await update.mutateAsync({ ...form, id: service.id });
        toast.success("Service mis à jour");
      } else {
        await create.mutateAsync(form);
        toast.success("Service créé");
      }
      onOpenChange(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: unknown } } };
      toast.error("Échec", {
        description: JSON.stringify(err?.response?.data ?? "Erreur").slice(0, 200),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{service?.id ? "Modifier le service" : "Nouveau service"}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nom</Label>
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label>Code (slug)</Label>
              <Input value={form.code ?? ""} onChange={(e) => set("code", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Description courte</Label>
            <Input
              value={form.short_description ?? ""}
              onChange={(e) => set("short_description", e.target.value)}
              maxLength={200}
            />
          </div>

          <div>
            <Label>Description longue</Label>
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Catégorie</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={(form.category as string) ?? ""}
                onChange={(e) => set("category", e.target.value || null)}
              >
                <option value="">— Aucune —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Type de tarification</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.pricing_type ?? "fixed"}
                onChange={(e) => set("pricing_type", e.target.value as PremiumService["pricing_type"])}
              >
                <option value="fixed">Prix fixe</option>
                <option value="per_unit">Par unité</option>
                <option value="percentage">% du total commande</option>
                <option value="variable">Variable (devis)</option>
              </select>
            </div>
            <div>
              <Label>Devise</Label>
              <Input value={form.currency ?? "XOF"} onChange={(e) => set("currency", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Prix de base</Label>
              <Input
                type="number" step="0.01"
                value={form.base_price ?? "0"}
                onChange={(e) => set("base_price", e.target.value)}
              />
            </div>
            <div>
              <Label>Pourcentage (0.05 = 5%)</Label>
              <Input
                type="number" step="0.0001"
                value={form.percentage ?? "0"}
                onChange={(e) => set("percentage", e.target.value)}
                disabled={form.pricing_type !== "percentage"}
              />
            </div>
            <div>
              <Label>Durée estimée (h)</Label>
              <Input
                type="number"
                value={form.estimated_hours ?? 0}
                onChange={(e) => set("estimated_hours", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox" checked={form.is_active ?? true}
                onChange={(e) => set("is_active", e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              Actif
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox" checked={form.is_visible ?? true}
                onChange={(e) => set("is_visible", e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              Visible client
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox" checked={form.is_required ?? false}
                onChange={(e) => set("is_required", e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              Recommandé / requis
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {service?.id ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
