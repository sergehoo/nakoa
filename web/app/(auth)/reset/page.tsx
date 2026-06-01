"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, endpoints } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPage() {
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const request = async () => {
    setLoading(true);
    try {
      await api.post(endpoints.auth.passwordResetRequest, { identifier: email });
      toast.success("Si un compte existe, un code a été envoyé.");
      setStep("confirm");
    } catch {
      toast.error("Impossible — réessayez");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    setLoading(true);
    try {
      await api.post(endpoints.auth.passwordResetConfirm, {
        identifier: email, code, new_password: password,
      });
      toast.success("Mot de passe réinitialisé");
      window.location.href = "/login";
    } catch {
      toast.error("Code invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Réinitialiser</h1>
        <p className="text-sm text-muted-foreground">
          {step === "request"
            ? "Entrez votre email pour recevoir un code de réinitialisation."
            : "Entrez le code reçu et votre nouveau mot de passe."}
        </p>
      </div>

      {step === "request" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={request} size="lg" className="w-full" disabled={loading || !email}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Envoyer le code
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code reçu</Label>
            <Input id="code" inputMode="numeric" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">Nouveau mot de passe</Label>
            <Input id="new_password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={confirm} size="lg" className="w-full" disabled={loading || !code || !password}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Réinitialiser
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/login" className="hover:underline">← Retour à la connexion</Link>
      </p>
    </div>
  );
}
