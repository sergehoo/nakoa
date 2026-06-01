"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useOtpRequest, useOtpVerify } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function OtpView() {
  const router = useRouter();
  const search = useSearchParams();
  const identifier = search.get("identifier") ?? "";
  const purpose = search.get("purpose") ?? "email_verify";
  const [code, setCode] = useState("");
  const request = useOtpRequest();
  const verify = useOtpVerify();

  const onResend = async () => {
    try {
      await request.mutateAsync({ identifier, purpose, channel: purpose.includes("email") ? "email" : "sms" });
      toast.success("Nouveau code envoyé");
    } catch {
      toast.error("Impossible de renvoyer le code");
    }
  };

  const onVerify = async () => {
    try {
      await verify.mutateAsync({ identifier, code, purpose });
      toast.success("Vérifié");
      router.push("/login");
    } catch {
      toast.error("Code invalide ou expiré");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Vérification</h1>
        <p className="text-sm text-muted-foreground">
          Entrez le code à 6 chiffres envoyé à <strong>{identifier}</strong>
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Code de vérification</Label>
          <Input
            id="code"
            inputMode="numeric"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123 456"
            className="text-center text-2xl tracking-[0.5em]"
          />
        </div>
        <Button onClick={onVerify} size="lg" className="w-full" disabled={verify.isPending || code.length < 4}>
          {verify.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Vérifier
        </Button>
        <Button onClick={onResend} variant="ghost" size="sm" className="w-full" disabled={request.isPending}>
          Renvoyer le code
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="hover:underline">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  );
}

function OtpFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={<OtpFallback />}>
      <OtpView />
    </Suspense>
  );
}
