"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck, MapPin, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { useMe, useUpdateMe } from "@/hooks/use-auth";
import { PushNotificationCard } from "@/components/notifications/push-notification-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { initials } from "@/lib/utils";

const profileSchema = z.object({
  first_name: z.string().min(2, "Prénom requis"),
  last_name: z.string().min(2, "Nom requis"),
  phone: z.string().min(8, "Téléphone trop court").optional().or(z.literal("")),
  country: z.string().min(2),
  locale: z.string().min(2),
  timezone: z.string().min(2),
  preferred_currency: z.string().min(2),
});

type ProfileFormData = z.infer<typeof profileSchema>;

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

const TIMEZONES = [
  "Africa/Abidjan",
  "Africa/Dakar",
  "Africa/Lagos",
  "Africa/Douala",
  "Europe/Paris",
  "UTC",
];

const CURRENCIES = [
  { code: "XOF", name: "Franc CFA (XOF)" },
  { code: "XAF", name: "Franc CFA Centrale (XAF)" },
  { code: "EUR", name: "Euro (EUR)" },
  { code: "USD", name: "Dollar US (USD)" },
];

export default function AccountPage() {
  const { data: me, isLoading } = useMe();
  const update = useUpdateMe();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      country: "CI",
      locale: "fr",
      timezone: "Africa/Abidjan",
      preferred_currency: "XOF",
    },
  });

  // Préremplit le form quand `me` arrive
  useEffect(() => {
    if (me) {
      reset({
        first_name: me.first_name ?? "",
        last_name: me.last_name ?? "",
        phone: me.phone ?? "",
        country: me.country ?? "CI",
        locale: me.locale ?? "fr",
        timezone: me.timezone ?? "Africa/Abidjan",
        preferred_currency: me.preferred_currency ?? "XOF",
      });
    }
  }, [me, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await update.mutateAsync({
        ...data,
        phone: data.phone || undefined,
      });
      toast.success("Profil mis à jour");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error("Échec de la mise à jour", {
        description: err?.response?.data?.detail ?? "Réessayez dans un instant.",
      });
    }
  };

  if (isLoading || !me) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Mon compte</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations personnelles, vos adresses et vos méthodes de paiement.
        </p>
      </div>

      {/* En-tête identité */}
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 md:flex-row md:items-center">
          <Avatar className="h-20 w-20">
            <AvatarImage src={me.avatar} />
            <AvatarFallback className="text-lg">{initials(me.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-lg font-semibold">{me.full_name}</p>
            <p className="text-sm text-muted-foreground">{me.email}</p>
            <p className="text-sm text-muted-foreground">{me.phone ?? "Téléphone non renseigné"}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant={me.is_email_verified ? "success" : "secondary"}>
                Email {me.is_email_verified ? "vérifié" : "à vérifier"}
              </Badge>
              <Badge variant={me.is_phone_verified ? "success" : "secondary"}>
                Téléphone {me.is_phone_verified ? "vérifié" : "à vérifier"}
              </Badge>
              <Badge variant="default">KYC niveau {me.kyc_level}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire édition */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input id="first_name" {...register("first_name")} />
                {errors.first_name && (
                  <p className="text-xs text-destructive">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input id="last_name" {...register("last_name")} />
                {errors.last_name && (
                  <p className="text-xs text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+225 07 XX XX XX XX"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Select
                  value={watch("country")}
                  onValueChange={(v) => setValue("country", v, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Langue</Label>
                <Select
                  value={watch("locale")}
                  onValueChange={(v) => setValue("locale", v, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuseau horaire</Label>
                <Select
                  value={watch("timezone")}
                  onValueChange={(v) => setValue("timezone", v, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Devise préférée</Label>
                <Select
                  value={watch("preferred_currency")}
                  onValueChange={(v) => setValue("preferred_currency", v, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => me && reset()}
                disabled={!isDirty || update.isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={!isDirty || update.isPending}>
                {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sous-pages */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <Link href="/account/addresses" className="block">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Mes adresses</p>
                <p className="text-sm text-muted-foreground">
                  Adresses de livraison et de facturation
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <Link href="/account/payment-methods" className="block">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Méthodes de paiement</p>
                <p className="text-sm text-muted-foreground">
                  Wave, Orange Money, MTN MoMo, carte bancaire
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Notifications push */}
      <PushNotificationCard />

      {/* Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Authentification à deux facteurs</p>
            <p className="text-sm text-muted-foreground">
              {me.two_factor_enabled
                ? "Activée — un code TOTP est demandé à chaque connexion."
                : "Renforcez la sécurité de votre compte avec une app d'authentification."}
            </p>
          </div>
          <Button asChild variant={me.two_factor_enabled ? "outline" : "default"}>
            <Link href="/two-factor">{me.two_factor_enabled ? "Gérer" : "Activer"}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
