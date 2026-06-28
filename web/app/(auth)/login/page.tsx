"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { NakoaLogo } from "@/components/brand/nakoa-logo";
import { toast } from "sonner";

import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Au moins 8 caractères"),
  two_factor_code: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ROLE_HOMES: Record<string, string> = {
  customer: "/dashboard",
  customer_corporate: "/dashboard",
  printer: "/p/dashboard",
  printer_agent: "/p/dashboard",
  quality_controller: "/p/dashboard",
  courier: "/dashboard",
  admin: "/a/dashboard",
  super_admin: "/a/dashboard",
  support: "/a/dashboard",
  accountant: "/a/dashboard",
};

// Sécurité : autorise uniquement les paths internes (pas d'open redirect).
function safeReturnPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null; // évite //evil.com
  if (raw.startsWith("/login") || raw.startsWith("/register")) return null;
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const fromParam = safeReturnPath(search.get("from"));
  const [needs2FA, setNeeds2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    // Double-click protection : si une requête est en cours, on ignore.
    if (login.isPending) return;
    try {
      const res = await login.mutateAsync(data);
      toast.success(`Bienvenue ${res.user.full_name}`);

      // 1) Si l'utilisateur venait d'une page protégée, on l'y renvoie.
      // 2) Sinon on l'envoie sur son dashboard rôle.
      const destination = fromParam ?? ROLE_HOMES[res.user.primary_role] ?? "/dashboard";

      // router.push + router.refresh pour invalider les RSC et que le middleware revoie les cookies
      router.push(destination);
      router.refresh();
    } catch (e: unknown) {
      const err = e as {
        response?: {
          status?: number;
          data?: {
            detail?: string | Record<string, string[] | string>;
            title?: string;
            reason?: string;
            identifier?: string;
            redirect_to?: string;
            suspension_reason?: string;
            locked_until?: string;
          };
        };
      };
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      const title = err?.response?.data?.title;
      const reason = err?.response?.data?.reason;
      const detailStr = typeof detail === "string" ? detail : "";

      // CAS 1 — Email non vérifié : redirige automatiquement vers /otp
      if (reason === "email_not_verified") {
        const userEmail = err?.response?.data?.identifier ?? data.email;
        toast.message("Email non vérifié", {
          description: "Un nouveau code de vérification vous a été envoyé.",
        });
        router.push(`/otp?identifier=${encodeURIComponent(userEmail)}&purpose=email_verify`);
        return;
      }

      // CAS 2 — Compte suspendu
      if (reason === "account_suspended") {
        toast.error("Compte suspendu", {
          description: err?.response?.data?.suspension_reason
            ? `Motif : ${err.response.data.suspension_reason}`
            : "Contactez le support pour plus d'informations.",
        });
        return;
      }

      // CAS 3 — Compte verrouillé temporairement
      if (reason === "account_locked") {
        toast.error("Compte verrouillé", {
          description: detailStr || "Trop de tentatives échouées. Patientez avant de réessayer.",
        });
        return;
      }

      // Détection 2FA (string ou title)
      const hint = `${detailStr} ${title ?? ""}`.toLowerCase();
      if (hint.includes("2fa") || hint.includes("two-factor")) {
        setNeeds2FA(true);
        toast.message("Code 2FA requis", {
          description: "Entrez le code à 6 chiffres de votre application.",
        });
        return;
      }

      // Erreurs détaillées par champ (rare en login, mais possible)
      if (detail && typeof detail === "object") {
        const messages = Object.entries(detail).map(([f, m]) => {
          const list = Array.isArray(m) ? m : [String(m)];
          return `${f === "email" ? "Email" : f === "password" ? "Mot de passe" : f} : ${list[0]}`;
        });
        toast.error(title || "Connexion échouée", {
          description: messages.join(" · "),
        });
        return;
      }

      // Messages explicites selon status
      if (status === 401) {
        toast.error("Identifiants incorrects", {
          description: "Email ou mot de passe invalide.",
        });
      } else if (status === 403) {
        toast.error("Compte bloqué", {
          description: detailStr || "Votre compte est suspendu. Contactez le support.",
        });
      } else if (status === 429) {
        toast.error("Trop de tentatives", {
          description: "Patientez quelques minutes avant de réessayer.",
        });
      } else if (status && status >= 500) {
        toast.error("Erreur serveur", {
          description: "Le serveur est temporairement indisponible.",
        });
      } else {
        toast.error("Connexion échouée", {
          description: detailStr || title || "Vérifiez vos identifiants.",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <NakoaLogo variant="icon-bg" size={44} />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
              Bon retour sur Nakoa
            </h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour gérer vos commandes et votre atelier.
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register/choose" className="text-primary font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
        {fromParam && (
          <p className="rounded-md border border-dashed bg-secondary/30 p-2 text-xs text-muted-foreground">
            Vous serez redirigé vers <code>{fromParam}</code> après connexion.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link href="/reset" className="text-xs text-muted-foreground hover:text-foreground">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {needs2FA && (
          <div className="animate-slide-up space-y-2">
            <Label htmlFor="two_factor_code">Code 2FA</Label>
            <Input
              id="two_factor_code"
              inputMode="numeric"
              maxLength={8}
              placeholder="123 456"
              {...register("two_factor_code")}
            />
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
          {login.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Se connecter
        </Button>
      </form>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
