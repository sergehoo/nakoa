"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
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
      const err = e as { response?: { data?: { detail?: string; title?: string } } };
      const detail = err?.response?.data?.title || err?.response?.data?.detail || "";
      if (typeof detail === "string" && detail.toLowerCase().includes("2fa")) {
        setNeeds2FA(true);
        toast.message("Code 2FA requis", {
          description: "Entrez le code à 6 chiffres de votre application.",
        });
      } else {
        toast.error("Connexion échouée", {
          description: detail || "Vérifiez vos identifiants.",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Connexion</h1>
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
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
          <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
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
