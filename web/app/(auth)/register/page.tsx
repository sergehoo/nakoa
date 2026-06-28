"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Eye, EyeOff, Loader2, Printer, User } from "lucide-react";
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
  // Champs spécifiques imprimeur / entreprise
  legal_name: z.string().optional(),
  trade_name: z.string().optional(),
  city: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type AccountType = "customer" | "customer_corporate" | "printer" | "courier";

function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();

  // Accepte ?type= (nouvelle convention) ou ?role= (rétro-compat)
  const typeParam = (search.get("type") || search.get("role")) as AccountType | null;
  const role: AccountType = typeParam ?? "customer";
  const isPrinter = role === "printer";
  const isCorporate = role === "customer_corporate";

  const register_ = useRegister();
  const [country, setCountry] = useState("CI");
  const [showPassword, setShowPassword] = useState(false);

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
      // Pour les imprimeurs, on précise dans le param next pour rediriger vers profil KYB après OTP
      const nextStep = isPrinter ? "&next=/p/profile" : "";
      router.push(`/otp?identifier=${encodeURIComponent(data.email)}&purpose=email_verify${nextStep}`);
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

  // Métadonnées d'affichage selon le rôle choisi
  const ROLE_META: Record<AccountType, {
    title: string;
    subtitle: string;
    icon: typeof User;
    accent: string;
  }> = {
    customer: {
      title: "Créer un compte client",
      subtitle: "Particulier — vos commandes en quelques clics.",
      icon: User,
      accent: "from-orange-500/20 to-amber-500/10 text-orange-400",
    },
    customer_corporate: {
      title: "Créer un compte entreprise",
      subtitle: "Facturation pro, multi-utilisateurs, commandes récurrentes.",
      icon: Building2,
      accent: "from-violet-500/20 to-fuchsia-500/10 text-violet-400",
    },
    printer: {
      title: "Devenir imprimeur partenaire",
      subtitle: "Rejoignez la marketplace Nakoa et recevez des commandes qualifiées.",
      icon: Printer,
      accent: "from-pink-500/20 to-rose-500/10 text-pink-400",
    },
    courier: {
      title: "Devenir livreur",
      subtitle: "Livrez les commandes Nakoa autour de vous.",
      icon: User,
      accent: "from-emerald-500/20 to-teal-500/10 text-emerald-400",
    },
  };
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${meta.accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
              {meta.title}
            </h1>
            <p className="text-sm text-muted-foreground">{meta.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <Link
            href="/register/choose"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Changer de type de compte
          </Link>
          <span className="text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {(isPrinter || isCorporate) && (
          <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isPrinter ? "Atelier d'impression" : "Votre organisation"}
            </p>
            <div className="space-y-2">
              <Label htmlFor="legal_name">
                Raison sociale <span className="text-destructive">*</span>
              </Label>
              <Input
                id="legal_name"
                placeholder={isPrinter ? "Ex. PrintCom SARL" : "Ex. Acme SAS"}
                {...register("legal_name", {
                  required: isPrinter || isCorporate ? "Raison sociale requise" : false,
                })}
              />
              {errors.legal_name && (
                <p className="text-xs text-destructive">{errors.legal_name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="trade_name">Nom commercial</Label>
                <Input id="trade_name" placeholder="Optionnel" {...register("trade_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input id="city" placeholder="Abidjan, Dakar, …" {...register("city")} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="first_name">
              {isPrinter || isCorporate ? "Prénom du contact" : "Prénom"}
            </Label>
            <Input id="first_name" {...register("first_name")} />
            {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">
              {isPrinter || isCorporate ? "Nom du contact" : "Nom"}
            </Label>
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="pr-10"
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">10 caractères minimum, mélange recommandé.</p>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={register_.isPending}>
          {register_.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPrinter
            ? "Devenir imprimeur partenaire"
            : isCorporate
              ? "Créer le compte entreprise"
              : "Créer mon compte"}
        </Button>
        {isPrinter && (
          <p className="rounded-md border border-pink-500/30 bg-pink-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Étape suivante :</strong> après vérification de votre email,
            vous accéderez à votre espace pour compléter votre profil atelier (KYB, équipements,
            zones de livraison) et activer votre catalogue.
          </p>
        )}
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
