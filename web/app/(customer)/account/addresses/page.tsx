"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Edit2, Loader2, MapPin, Plus, Star, Trash2, Building2, Truck,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAddresses, useCreateAddress, useUpdateAddress,
  useDeleteAddress, useSetDefaultAddress,
  type UserAddress, type AddressInput,
} from "@/hooks/use-account";
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

const COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "SN", name: "Sénégal" },
  { code: "BJ", name: "Bénin" },
  { code: "TG", name: "Togo" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "CM", name: "Cameroun" },
  { code: "FR", name: "France" },
];

const schema = z.object({
  kind: z.enum(["shipping", "billing", "pickup"]),
  label: z.string().optional(),
  full_name: z.string().min(2, "Nom complet requis"),
  phone: z.string().optional(),
  line1: z.string().min(3, "Adresse requise"),
  line2: z.string().optional(),
  city: z.string().min(2, "Ville requise"),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().min(2),
  landmark: z.string().optional(),
  is_default: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

function KindIcon({ kind }: { kind: UserAddress["kind"] }) {
  if (kind === "billing") return <Building2 className="h-4 w-4" />;
  if (kind === "pickup") return <Truck className="h-4 w-4" />;
  return <MapPin className="h-4 w-4" />;
}

function kindLabel(kind: UserAddress["kind"]) {
  return kind === "billing" ? "Facturation" : kind === "pickup" ? "Retrait" : "Livraison";
}

function AddressDialog({
  trigger,
  initial,
  onSubmit,
  loading,
}: {
  trigger: React.ReactNode;
  initial?: UserAddress;
  onSubmit: (data: AddressInput) => Promise<void>;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ? {
      kind: initial.kind,
      label: initial.label,
      full_name: initial.full_name,
      phone: initial.phone,
      line1: initial.line1,
      line2: initial.line2,
      city: initial.city,
      region: initial.region,
      postal_code: initial.postal_code,
      country: initial.country,
      landmark: initial.landmark,
      is_default: initial.is_default,
    } : {
      kind: "shipping",
      country: "CI",
      is_default: false,
    },
  });

  const submit = async (data: FormData) => {
    await onSubmit(data);
    setOpen(false);
    if (!initial) reset({ kind: "shipping", country: "CI" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier l'adresse" : "Nouvelle adresse"}</DialogTitle>
          <DialogDescription>
            Vos adresses sont utilisées pour la livraison de vos commandes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={watch("kind")}
                onValueChange={(v) => setValue("kind", v as FormData["kind"], { shouldDirty: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipping">Livraison</SelectItem>
                  <SelectItem value="billing">Facturation</SelectItem>
                  <SelectItem value="pickup">Retrait</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Étiquette (optionnelle)</Label>
              <Input id="label" placeholder="Ex: Maison, Bureau…" {...register("label")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet du destinataire</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" placeholder="+225 07…" {...register("phone")} />
            </div>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="line1">Adresse</Label>
            <Input id="line1" placeholder="Rue, numéro, quartier" {...register("line1")} />
            {errors.line1 && <p className="text-xs text-destructive">{errors.line1.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="line2">Complément (optionnel)</Label>
            <Input id="line2" placeholder="Bâtiment, étage, appartement…" {...register("line2")} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input id="city" {...register("city")} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Région (optionnel)</Label>
              <Input id="region" {...register("region")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal (optionnel)</Label>
              <Input id="postal_code" {...register("postal_code")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark">Repère / point de chute (optionnel)</Label>
            <Input
              id="landmark"
              placeholder="Ex: en face de la pharmacie, à côté du marché…"
              {...register("landmark")}
            />
            <p className="text-xs text-muted-foreground">
              Aide précieuse pour le livreur en l&apos;absence de système d&apos;adresses formalisé.
            </p>
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

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const del = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const list = (addresses as UserAddress[] | undefined) ?? [];

  const handleCreate = async (data: AddressInput) => {
    try {
      await create.mutateAsync(data);
      toast.success("Adresse ajoutée");
    } catch {
      toast.error("Impossible d'ajouter l'adresse");
    }
  };

  const handleUpdate = (id: string) => async (data: AddressInput) => {
    try {
      await update.mutateAsync({ id, payload: data });
      toast.success("Adresse mise à jour");
    } catch {
      toast.error("Impossible de mettre à jour l'adresse");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette adresse ?")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Adresse supprimée");
    } catch {
      toast.error("Impossible de supprimer l'adresse");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
      toast.success("Adresse par défaut mise à jour");
    } catch {
      toast.error("Impossible de marquer comme par défaut");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
            <Link href="/account"><ArrowLeft className="mr-1 h-4 w-4" /> Mon compte</Link>
          </Button>
          <h1 className="font-display text-3xl font-bold tracking-tight">Mes adresses</h1>
          <p className="text-sm text-muted-foreground">
            Carnet d&apos;adresses pour vos livraisons et facturations.
          </p>
        </div>
        <AddressDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle adresse
            </Button>
          }
          onSubmit={handleCreate}
          loading={create.isPending}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Aucune adresse enregistrée</p>
              <p className="text-sm text-muted-foreground">
                Ajoutez votre première adresse pour gagner du temps à chaque commande.
              </p>
            </div>
            <AddressDialog
              trigger={<Button><Plus className="mr-2 h-4 w-4" /> Ajouter une adresse</Button>}
              onSubmit={handleCreate}
              loading={create.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((a) => (
            <Card key={a.id} className="flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <KindIcon kind={a.kind} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {a.label || kindLabel(a.kind)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{kindLabel(a.kind)}</p>
                    </div>
                  </div>
                  {a.is_default && (
                    <Badge variant="success" className="gap-1">
                      <Star className="h-3 w-3" /> Par défaut
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{a.full_name}</p>
                  {a.phone && <p className="text-muted-foreground">{a.phone}</p>}
                  <p>{a.line1}</p>
                  {a.line2 && <p>{a.line2}</p>}
                  <p>
                    {a.city}{a.region ? `, ${a.region}` : ""}
                    {a.postal_code && ` — ${a.postal_code}`}
                  </p>
                  <p className="text-muted-foreground">{a.country}</p>
                  {a.landmark && (
                    <p className="text-xs italic text-muted-foreground">↪ {a.landmark}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {!a.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(a.id)}
                      disabled={setDefault.isPending}
                    >
                      <Star className="mr-1 h-3 w-3" /> Définir par défaut
                    </Button>
                  )}
                  <AddressDialog
                    trigger={
                      <Button size="sm" variant="ghost">
                        <Edit2 className="mr-1 h-3 w-3" /> Modifier
                      </Button>
                    }
                    initial={a}
                    onSubmit={handleUpdate(a.id)}
                    loading={update.isPending}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(a.id)}
                    disabled={del.isPending}
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
