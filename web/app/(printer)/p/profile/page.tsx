"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2, Edit2, Loader2, MapPin, Plus, Power, Printer,
  Save, Trash2, Truck, Wrench, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  usePrinterProfile, useUpdatePrinterProfile,
  useMachines, useSaveMachine, useDeleteMachine,
  useDeliveryZones, useSaveDeliveryZone, useDeleteDeliveryZone,
  type Machine, type DeliveryZone,
} from "@/hooks/use-printer";
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

const COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Sénégal" },
  { code: "BJ", name: "Bénin" },
  { code: "TG", name: "Togo" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "CM", name: "Cameroun" },
];

// =============================================================================
// Onglet 1 — Informations légales (KYB)
// =============================================================================
const profileSchema = z.object({
  legal_name: z.string().min(2, "Raison sociale requise"),
  trade_name: z.string().optional(),
  description: z.string().optional(),
  rccm: z.string().optional(),
  tax_id: z.string().optional(),
  country: z.string().min(2),
  city: z.string().min(2, "Ville requise"),
  address: z.string().min(3, "Adresse requise"),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  founded_year: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional(),
  staff_count: z.coerce.number().int().min(1).optional(),
  capacity_per_day: z.coerce.number().int().min(1).optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

function LegalInfoCard() {
  const { data: profile, isLoading } = usePrinterProfile();
  const update = useUpdatePrinterProfile();

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (profile) {
      reset({
        legal_name: profile.legal_name ?? "",
        trade_name: profile.trade_name ?? "",
        description: profile.description ?? "",
        rccm: profile.rccm ?? "",
        tax_id: profile.tax_id ?? "",
        country: profile.country ?? "CI",
        city: profile.city ?? "",
        address: profile.address ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        website: profile.website ?? "",
        founded_year: profile.founded_year ?? undefined,
        staff_count: profile.staff_count ?? undefined,
        capacity_per_day: profile.capacity_per_day ?? undefined,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      await update.mutateAsync(data);
      toast.success("Profil mis à jour");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error("Échec de la mise à jour", {
        description: err?.response?.data?.detail ?? "Réessayez.",
      });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Informations légales
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Informations utilisées pour vos factures, contrats et identification publique.
            </p>
          </div>
          {profile && (
            <Badge
              variant={profile.kyc_status === "approved" ? "success" : "secondary"}
              className="gap-1"
            >
              <ShieldCheck className="h-3 w-3" />
              {profile.kyc_status === "approved" ? "KYB approuvé" :
                profile.kyc_status === "submitted" ? "KYB en revue" :
                profile.kyc_status === "rejected" ? "KYB rejeté" : "KYB en attente"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legal_name">Raison sociale</Label>
              <Input id="legal_name" {...register("legal_name")} />
              {errors.legal_name && <p className="text-xs text-destructive">{errors.legal_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade_name">Nom commercial</Label>
              <Input id="trade_name" {...register("trade_name")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Présentation publique de votre imprimerie…"
              {...register("description")}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rccm">RCCM (registre commerce)</Label>
              <Input id="rccm" placeholder="CI-ABJ-2026-B-12345" {...register("rccm")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_id">N° fiscal</Label>
              <Input id="tax_id" placeholder="CC123456789" {...register("tax_id")} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select
                value={watch("country")}
                onValueChange={(v) => setValue("country", v, { shouldDirty: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" {...register("city")} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="founded_year">Année de création</Label>
              <Input id="founded_year" type="number" {...register("founded_year")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" placeholder="Rue, quartier" {...register("address")} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" placeholder="+225 27…" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email public</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Site web</Label>
              <Input id="website" type="url" placeholder="https://…" {...register("website")} />
              {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff_count">Effectif</Label>
              <Input id="staff_count" type="number" {...register("staff_count")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity_per_day">Capacité (unités/jour)</Label>
              <Input id="capacity_per_day" type="number" {...register("capacity_per_day")} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => reset()} disabled={!isDirty}>
              Annuler
            </Button>
            <Button type="submit" disabled={!isDirty || update.isPending}>
              {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Onglet 2 — Parc machines
// =============================================================================
const machineSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().min(1, "Catégorie requise"),
  max_format: z.string().optional(),
  is_color: z.boolean().optional(),
  capacity_per_hour: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
});
type MachineForm = z.infer<typeof machineSchema>;

const MACHINE_CATEGORIES = [
  { code: "offset", label: "Offset" },
  { code: "digital", label: "Numérique" },
  { code: "large_format", label: "Grand format" },
  { code: "screen", label: "Sérigraphie" },
  { code: "engraving", label: "Gravure" },
  { code: "finishing", label: "Finition" },
  { code: "other", label: "Autre" },
];

function MachineDialog({
  trigger, initial, onSubmit, loading,
}: {
  trigger: React.ReactNode;
  initial?: Machine;
  onSubmit: (data: MachineForm) => Promise<void>;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<MachineForm>({
    resolver: zodResolver(machineSchema),
    defaultValues: initial ? {
      name: initial.name, brand: initial.brand, model: initial.model,
      category: initial.category, max_format: initial.max_format,
      is_color: initial.is_color, capacity_per_hour: initial.capacity_per_hour,
      notes: initial.notes,
    } : { category: "digital", is_color: true },
  });

  const submit = async (data: MachineForm) => {
    await onSubmit(data);
    setOpen(false);
    if (!initial) reset({ category: "digital", is_color: true });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier la machine" : "Ajouter une machine"}</DialogTitle>
          <DialogDescription>
            Vos machines servent au moteur de matching pour vous attribuer les bons jobs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom interne</Label>
            <Input id="name" placeholder="Ex: HP Indigo #1" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand">Marque</Label>
              <Input id="brand" placeholder="HP, Heidelberg…" {...register("brand")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modèle</Label>
              <Input id="model" {...register("model")} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={watch("category")}
                onValueChange={(v) => setValue("category", v, { shouldDirty: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MACHINE_CATEGORIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_format">Format max</Label>
              <Input id="max_format" placeholder="A3, B2, 100x70cm…" {...register("max_format")} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="capacity_per_hour">Cadence (u/h)</Label>
              <Input id="capacity_per_hour" type="number" {...register("capacity_per_hour")} />
            </div>
            <div className="flex items-end space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("is_color")} className="h-4 w-4" />
                Couleur
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initial ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MachinesCard() {
  const { data: machines, isLoading } = useMachines();
  const save = useSaveMachine();
  const del = useDeleteMachine();
  const list = (machines as Machine[] | undefined) ?? [];

  const handleSave = (id?: string) => async (data: MachineForm) => {
    try {
      await save.mutateAsync({ id, payload: data as Partial<Machine> });
      toast.success(id ? "Machine mise à jour" : "Machine ajoutée");
    } catch {
      toast.error("Échec de l'enregistrement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Retirer cette machine du parc ?")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Machine retirée");
    } catch {
      toast.error("Impossible de supprimer");
    }
  };

  const handleToggleActive = async (m: Machine) => {
    try {
      await save.mutateAsync({ id: m.id, payload: { is_active: !m.is_active } });
    } catch {
      toast.error("Impossible de basculer");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Parc machines
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Le moteur IA utilise vos machines pour matcher les bonnes commandes.
            </p>
          </div>
          <MachineDialog
            trigger={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>}
            onSubmit={handleSave()}
            loading={save.isPending}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucune machine déclarée. Ajoutez-en pour devenir éligible aux jobs.
          </p>
        ) : (
          list.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Printer className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[m.brand, m.model, m.max_format].filter(Boolean).join(" · ") || m.category}
                    {m.capacity_per_hour ? ` · ${m.capacity_per_hour}u/h` : ""}
                    {m.is_color ? " · Couleur" : " · N&B"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={m.is_active ? "success" : "secondary"} className="text-[10px]">
                  {m.is_active ? "Active" : "Inactive"}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => handleToggleActive(m)}>
                  <Power className="h-3.5 w-3.5" />
                </Button>
                <MachineDialog
                  trigger={<Button size="icon" variant="ghost"><Edit2 className="h-3.5 w-3.5" /></Button>}
                  initial={m}
                  onSubmit={handleSave(m.id)}
                  loading={save.isPending}
                />
                <Button
                  size="icon" variant="ghost" className="text-destructive"
                  onClick={() => handleDelete(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Onglet 3 — Zones de livraison
// =============================================================================
const zoneSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  country: z.string().min(2),
  city: z.string().optional(),
  radius_km: z.coerce.number().min(0).optional(),
  delivery_fee: z.coerce.number().min(0),
  estimated_days: z.coerce.number().int().min(0).max(30),
});
type ZoneForm = z.infer<typeof zoneSchema>;

function ZoneDialog({
  trigger, initial, onSubmit, loading,
}: {
  trigger: React.ReactNode;
  initial?: DeliveryZone;
  onSubmit: (data: ZoneForm) => Promise<void>;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<ZoneForm>({
    resolver: zodResolver(zoneSchema),
    defaultValues: initial ? {
      name: initial.name, country: initial.country, city: initial.city,
      radius_km: initial.radius_km ?? 0, delivery_fee: Number(initial.delivery_fee),
      estimated_days: initial.estimated_days,
    } : { country: "CI", radius_km: 25, delivery_fee: 1000, estimated_days: 2 },
  });

  const submit = async (data: ZoneForm) => {
    await onSubmit(data);
    setOpen(false);
    if (!initial) reset({ country: "CI", radius_km: 25, delivery_fee: 1000, estimated_days: 2 });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier la zone" : "Nouvelle zone de livraison"}</DialogTitle>
          <DialogDescription>
            Définissez où vous livrez, à quel tarif et sous combien de jours.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la zone</Label>
            <Input id="name" placeholder="Ex: Abidjan Centre, Cocody+Plateau…" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select
                value={watch("country")}
                onValueChange={(v) => setValue("country", v, { shouldDirty: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville principale</Label>
              <Input id="city" {...register("city")} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="radius_km">Rayon (km)</Label>
              <Input id="radius_km" type="number" {...register("radius_km")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_fee">Frais (XOF)</Label>
              <Input id="delivery_fee" type="number" step="100" {...register("delivery_fee")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_days">Délai (jours)</Label>
              <Input id="estimated_days" type="number" {...register("estimated_days")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initial ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ZonesCard() {
  const { data: zones, isLoading } = useDeliveryZones();
  const save = useSaveDeliveryZone();
  const del = useDeleteDeliveryZone();
  const list = (zones as DeliveryZone[] | undefined) ?? [];

  const handleSave = (id?: string) => async (data: ZoneForm) => {
    try {
      await save.mutateAsync({ id, payload: data as Partial<DeliveryZone> });
      toast.success(id ? "Zone mise à jour" : "Zone ajoutée");
    } catch {
      toast.error("Échec");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette zone de livraison ?")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Zone supprimée");
    } catch {
      toast.error("Impossible de supprimer");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Zones de livraison
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Les zones que vous couvrez et le tarif appliqué.
            </p>
          </div>
          <ZoneDialog
            trigger={<Button size="sm"><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>}
            onSubmit={handleSave()}
            loading={save.isPending}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : list.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucune zone configurée. Vous ne recevrez aucune commande tant qu&apos;aucune zone n&apos;est définie.
          </p>
        ) : (
          list.map((z) => (
            <div key={z.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{z.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {z.city ? `${z.city}, ${z.country}` : z.country}
                    {z.radius_km ? ` · ${z.radius_km} km` : ""}
                    {` · ${formatCurrency(Number(z.delivery_fee), "XOF")} · ${z.estimated_days}j`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={z.is_active ? "success" : "secondary"} className="text-[10px]">
                  {z.is_active ? "Active" : "Inactive"}
                </Badge>
                <ZoneDialog
                  trigger={<Button size="icon" variant="ghost"><Edit2 className="h-3.5 w-3.5" /></Button>}
                  initial={z}
                  onSubmit={handleSave(z.id)}
                  loading={save.isPending}
                />
                <Button
                  size="icon" variant="ghost" className="text-destructive"
                  onClick={() => handleDelete(z.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Page principale
// =============================================================================
export default function PrinterProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Profil imprimerie</h1>
        <p className="text-sm text-muted-foreground">
          Informations légales, parc machines et zones de livraison.
        </p>
      </div>

      <LegalInfoCard />
      <MachinesCard />
      <ZonesCard />
    </div>
  );
}
