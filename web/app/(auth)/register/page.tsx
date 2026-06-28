"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  email: z.string().email("Email invalide"),
  first_name: z.string().min(2, "Prénom requis"),
  last_name: z.string().min(2, "Nom requis"),
  phone: z.string().min(8, "Téléphone requis").optional().or(z.literal("")),
  password: z.string().min(10, "10 caractères minimum"),
  country: z.string().min(2),
});

type FormData = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const role = (search.get("role") as "customer" | "printer" | "courier") ?? "customer";
  const register_ = useRegister();
  const [country, setCountry] = useState("CI");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: "CI" },
  });

  // Mappe le nom de champ backend vers le nom de champ frontend
  const FIELD_MAP: Record<string, keyof FormData> = {
    email: "email",
    phone: "phone",
    password: "password",
    first_name: "first_name",
    last_name: "last_name",
    country: "country",
  };

  // Messages plus parlants pour les erreurs courantes du backend
  function humanize(field: string, raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes("existe déjà") || lower.includes("already exists")) {
      if (field === "email") return "Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.";
      if (field === "phone") return "Ce numéro est déjà associé à un compte.";
    }
    if (lower.includes("valide") && field === "email") return "Format d'email invalide.";
    if (lower.includes("password") && lower.includes("commun")) return "Mot de passe trop commun.";
    return raw;
  }

  const onSubmit = async (data: FormData) => {
    try {
      await register_.mutateAsync({
        ...data,
        country,
        primary_role: role,
        phone: data.phone || undefined,
      });
      toast.success("Compte créé", {
        description: "Un code de vérification a été envoyé à votre email.",
      });
      router.push(`/otp?identifier=${encodeURIComponent(data.email)}&purpose=email_verify`);
    } catch (e: unknown) {
      const err = e as {
        response?: {
          status?: number;
          data?: {
            detail?: string | Record<string, string[] | string>;
            title?: string;
          };
        };
      };
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      const title = err?.response?.data?.title;

      // Cas 1 : detail est un objet { field: ["msg1", "msg2"], ... }
      if (detail && typeof detail === "object") {
        const fieldErrors: string[] = [];
        for (const [backendField, msgs] of Object.entries(detail)) {
          const frontField = FIELD_MAP[backendField];
          const list = Array.isArray(msgs) ? msgs : [String(msgs)];
          const message = humanize(backendField, list[0] ?? "Erreur");

          if (frontField) {
            setError(frontField, { type: "server", message });
          }
          fieldErrors.push(`${backendField}: ${message}`);
        }

        toast.error(title || "Vérifiez les champs", {
          description: fieldErrors.length
            ? "Certaines informations doivent être corrigées."
            : "Erreur de validation.",
        });
        return;
      }

      // Cas 2 : detail est une string simple
      if (typeof detail === "string") {
        toast.error(title || "Inscription échouée", { description: detail });
        return;
      }

      // Cas 3 : pas de detail → message générique selon le statut
      if (status === 429) {
        toast.error("Trop de tentatives", {
          description: "Patientez quelques minutes avant de réessayer.",
        });
      } else if (status && status >= 500) {
        toast.error("Erreur serveur", {
          description: "Le serveur est temporairement indisponible. Réessayez dans un instant.",
        });
      } else {
        toast.error("Inscription échouée", { description: title || "Réessayez." });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {role === "printer" ? "Devenir imprimeur" : "Créer un compte"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Déjà un compte ? <Link href="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="first_name">Prénom</Label>
            <Input id="first_name" {...register("first_name")} />
            {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Nom</Label>
            <Input id="last_name" {...register("last_name")} />
            {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone (optionnel)</Label>
          <Input id="phone" type="tel" placeholder="+225 07 XX XX XX XX" {...register("phone")} />
        </div>
        <div className="space-y-2">
          <Label>Pays</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CI">Côte d&apos;Ivoire</SelectItem>
              <SelectItem value="SN">Sénégal</SelectItem>
              <SelectItem value="BJ">Bénin</SelectItem>
              <SelectItem value="TG">Togo</SelectItem>
              <SelectItem value="BF">Burkina Faso</SelectItem>
              <SelectItem value="ML">Mali</SelectItem>
              <SelectItem value="CM">Cameroun</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" {...register("password")} />
          <p className="text-xs text-muted-foreground">10 caractères minimum, mélange recommandé.</p>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={register_.isPending}>
          {register_.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer mon compte
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          En continuant, vous acceptez nos{" "}
          <Link href="/legal/cgu" className="underline">CGU</Link> et notre{" "}
          <Link href="/legal/privacy" className="underline">politique de confidentialité</Link>.
        </p>
      </form>
    </div>
  );
}

function RegisterFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
