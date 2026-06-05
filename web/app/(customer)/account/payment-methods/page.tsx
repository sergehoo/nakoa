"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Plus, Star, Trash2, CreditCard, Smartphone } from "lucide-react";
import { toast } from "sonner";

import {
  usePaymentMethods, useCreatePaymentMethod,
  useDeletePaymentMethod, useSetDefaultPaymentMethod,
  type PaymentMethod, type PaymentMethodInput,
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

// Méthodes supportées (sans CB — qui passe par tokenisation Stripe, non géré ici)
const PROVIDERS = [
  { kind: "wave", label: "Wave", color: "bg-blue-500", needs_phone: true },
  { kind: "orange_money", label: "Orange Money", color: "bg-orange-500", needs_phone: true },
  { kind: "mtn_momo", label: "MTN Mobile Money", color: "bg-yellow-500", needs_phone: true },
  { kind: "moov", label: "Moov Money", color: "bg-cyan-500", needs_phone: true },
] as const;

const schema = z.object({
  kind: z.enum(["wave", "orange_money", "mtn_momo", "moov", "card_stripe", "bank_transfer"]),
  label: z.string().optional(),
  phone_number: z.string().min(8, "Numéro requis (≥ 8 chiffres)").optional().or(z.literal("")),
  is_default: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

function ProviderLogo({ kind }: { kind: PaymentMethod["kind"] }) {
  const provider = PROVIDERS.find((p) => p.kind === kind);
  if (kind === "card_stripe") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
        <CreditCard className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold text-white ${
        provider?.color ?? "bg-muted"
      }`}
    >
      {kind === "wave" && "W"}
      {kind === "orange_money" && "OM"}
      {kind === "mtn_momo" && "M"}
      {kind === "moov" && "Mv"}
    </div>
  );
}

function providerLabel(kind: PaymentMethod["kind"]) {
  return PROVIDERS.find((p) => p.kind === kind)?.label ?? kind;
}

function AddPaymentDialog({
  trigger,
  onSubmit,
  loading,
}: {
  trigger: React.ReactNode;
  onSubmit: (data: PaymentMethodInput) => Promise<void>;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { kind: "wave", is_default: false },
  });

  const selectedKind = watch("kind");
  const needsPhone = PROVIDERS.some(
    (p) => p.kind === selectedKind && p.needs_phone,
  );

  const submit = async (data: FormData) => {
    await onSubmit({
      ...data,
      phone_number: data.phone_number || undefined,
    });
    setOpen(false);
    reset({ kind: "wave", is_default: false });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une méthode de paiement</DialogTitle>
          <DialogDescription>
            Pour le Mobile Money, vous recevrez un code à valider au moment du paiement.
            Aucun montant n&apos;est prélevé lors de l&apos;enregistrement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Fournisseur</Label>
            <Select
              value={selectedKind}
              onValueChange={(v) => setValue("kind", v as FormData["kind"], { shouldDirty: true })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.kind} value={p.kind}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Étiquette (optionnel)</Label>
            <Input id="label" placeholder="Ex: Wave perso, OM pro…" {...register("label")} />
          </div>

          {needsPhone && (
            <div className="space-y-2">
              <Label htmlFor="phone_number">Numéro de téléphone</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone_number"
                  type="tel"
                  placeholder="+225 07 XX XX XX XX"
                  className="pl-9"
                  {...register("phone_number")}
                />
              </div>
              {errors.phone_number && (
                <p className="text-xs text-destructive">{errors.phone_number.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Numéro associé à votre compte {providerLabel(selectedKind)}.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PaymentMethodsPage() {
  const { data: methods, isLoading } = usePaymentMethods();
  const create = useCreatePaymentMethod();
  const del = useDeletePaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();

  const list = (methods as PaymentMethod[] | undefined) ?? [];

  const handleCreate = async (data: PaymentMethodInput) => {
    try {
      await create.mutateAsync(data);
      toast.success("Méthode ajoutée");
    } catch {
      toast.error("Impossible d'ajouter la méthode");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette méthode de paiement ?")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Méthode supprimée");
    } catch {
      toast.error("Impossible de supprimer la méthode");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
      toast.success("Méthode par défaut mise à jour");
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
          <h1 className="font-display text-3xl font-bold tracking-tight">Méthodes de paiement</h1>
          <p className="text-sm text-muted-foreground">
            Enregistrez vos comptes Mobile Money pour payer en un clic.
          </p>
        </div>
        <AddPaymentDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
          }
          onSubmit={handleCreate}
          loading={create.isPending}
        />
      </div>

      {/* Carrousel de logos providers supportés */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-around gap-6 py-6">
          {PROVIDERS.map((p) => (
            <div key={p.kind} className="flex flex-col items-center gap-2 text-center">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white ${p.color}`}
              >
                {p.kind === "wave" && "W"}
                {p.kind === "orange_money" && "OM"}
                {p.kind === "mtn_momo" && "M"}
                {p.kind === "moov" && "Mv"}
              </div>
              <p className="text-xs font-medium">{p.label}</p>
            </div>
          ))}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <CreditCard className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">Carte bancaire</p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Aucune méthode enregistrée</p>
              <p className="text-sm text-muted-foreground">
                Ajoutez votre première méthode pour payer plus rapidement.
              </p>
            </div>
            <AddPaymentDialog
              trigger={<Button><Plus className="mr-2 h-4 w-4" /> Ajouter une méthode</Button>}
              onSubmit={handleCreate}
              loading={create.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((m) => (
            <Card key={m.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <ProviderLogo kind={m.kind} />
                    <div>
                      <CardTitle className="text-base">
                        {m.label || providerLabel(m.kind)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{providerLabel(m.kind)}</p>
                    </div>
                  </div>
                  {m.is_default && (
                    <Badge variant="success" className="gap-1">
                      <Star className="h-3 w-3" /> Par défaut
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  {m.phone_number && (
                    <p className="font-mono">{m.phone_number}</p>
                  )}
                  {m.card_brand && m.card_last4 && (
                    <p className="font-mono">{m.card_brand} •••• {m.card_last4}</p>
                  )}
                  {m.masked_account && !m.phone_number && (
                    <p className="font-mono">{m.masked_account}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {!m.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(m.id)}
                      disabled={setDefault.isPending}
                    >
                      <Star className="mr-1 h-3 w-3" /> Définir par défaut
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(m.id)}
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
