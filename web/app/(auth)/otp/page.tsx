"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle, CheckCircle2, Clock, Loader2, Mail, RefreshCw, Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { useOtpRequest, useOtpVerify } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEFAULT_EXPIRY_SECONDS = 5 * 60; // 5 minutes — aligné sur backend
const RESEND_COOLDOWN_SECONDS = 60;     // 1 minute entre 2 renvois

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function OtpView() {
  const router = useRouter();
  const search = useSearchParams();
  const identifier = search.get("identifier") ?? "";
  const purpose = search.get("purpose") ?? "email_verify";
  const channel = purpose.includes("email") ? "email" : "sms";

  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const requestedOnceRef = useRef(false);

  const request = useOtpRequest();
  const verify = useOtpVerify();

  // Lance un timer décrémentant chaque seconde
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Demande automatique d'un OTP au premier rendu (si pas déjà fait)
  // Désactivé par défaut pour respecter le flow d'inscription (le backend a déjà
  // envoyé l'OTP). L'utilisateur peut redemander via "Renvoyer".
  // Si tu veux trigger auto, décommente ce useEffect.
  /*
  useEffect(() => {
    if (requestedOnceRef.current || !identifier) return;
    requestedOnceRef.current = true;
    request.mutate(
      { identifier, purpose, channel },
      {
        onSuccess: (data) => {
          setSecondsLeft(data.expires_in_seconds);
          setResendCooldown(RESEND_COOLDOWN_SECONDS);
        },
      },
    );
  }, [identifier, purpose, channel, request]);
  */

  const expired = secondsLeft === 0;

  const onResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    try {
      const data = await request.mutateAsync({ identifier, purpose, channel });
      setSecondsLeft(data.expires_in_seconds || DEFAULT_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setCode("");
      toast.success("Nouveau code envoyé", {
        description: channel === "email"
          ? `Vérifiez votre boîte ${identifier} (et le dossier spam).`
          : `SMS envoyé au ${identifier}.`,
      });
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { detail?: string } } };
      if (err?.response?.status === 429) {
        toast.error("Trop de demandes", {
          description: "Patientez quelques minutes avant de redemander un code.",
        });
      } else {
        toast.error("Impossible de renvoyer le code", {
          description: err?.response?.data?.detail ?? "Réessayez dans un instant.",
        });
      }
    }
  }, [identifier, purpose, channel, request, resendCooldown]);

  const onVerify = useCallback(async () => {
    if (expired) {
      toast.error("Code expiré", { description: "Demandez un nouveau code." });
      return;
    }
    try {
      await verify.mutateAsync({ identifier, code, purpose });
      toast.success("Vérification réussie !", {
        description: "Vous pouvez maintenant vous connecter.",
      });
      router.push("/login");
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { detail?: string } } };
      const detail = err?.response?.data?.detail ?? "";
      if (detail.toLowerCase().includes("expir")) {
        setSecondsLeft(0);
        toast.error("Code expiré", { description: "Demandez un nouveau code." });
      } else if (detail.toLowerCase().includes("essai") || detail.toLowerCase().includes("attempt")) {
        toast.error("Trop d'essais", { description: "Demandez un nouveau code." });
        setSecondsLeft(0);
      } else {
        toast.error("Code invalide", { description: detail || "Vérifiez les chiffres saisis." });
      }
    }
  }, [identifier, code, purpose, verify, router, expired]);

  // Auto-submit quand 6 chiffres saisis
  useEffect(() => {
    if (code.length === 6 && !verify.isPending && !expired) {
      onVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const ChannelIcon = channel === "email" ? Mail : Smartphone;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-full",
          expired
            ? "bg-destructive/15 text-destructive"
            : "bg-gradient-to-br from-orange-500/20 to-amber-500/10 text-orange-500",
        )}>
          {expired ? <AlertCircle className="h-7 w-7" /> : <ChannelIcon className="h-7 w-7" />}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {expired ? "Code expiré" : "Vérification"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {expired ? (
            <>Demandez un nouveau code pour continuer.</>
          ) : (
            <>
              Entrez le code à <strong>6 chiffres</strong> envoyé à{" "}
              <strong className="text-foreground">{identifier}</strong>
            </>
          )}
        </p>
      </div>

      {/* Timer / état expiré */}
      <div className={cn(
        "flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm",
        expired
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : secondsLeft < 60
            ? "border-amber-500/40 bg-amber-500/5 text-amber-500"
            : "border-border bg-secondary/30 text-muted-foreground",
      )}>
        <Clock className="h-4 w-4" />
        {expired ? (
          <span className="font-medium">Code expiré</span>
        ) : (
          <>
            <span>Expire dans</span>
            <span className="font-mono font-semibold tabular-nums">
              {formatTime(secondsLeft)}
            </span>
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Code de vérification</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123 456"
            disabled={expired}
            className={cn(
              "text-center text-3xl font-mono tracking-[0.5em] py-7",
              expired && "opacity-50",
            )}
          />
        </div>

        <Button
          onClick={onVerify}
          size="lg"
          className="w-full"
          disabled={verify.isPending || expired || code.length < 6}
        >
          {verify.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Vérifier
        </Button>

        <Button
          onClick={onResend}
          variant={expired ? "default" : "ghost"}
          size="sm"
          className="w-full"
          disabled={request.isPending || resendCooldown > 0}
        >
          {request.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
          )}
          {resendCooldown > 0
            ? `Renvoyer dans ${resendCooldown}s`
            : "Renvoyer le code"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>

      <div className="rounded-lg border border-dashed bg-secondary/20 p-3 text-xs text-muted-foreground">
        💡 <strong>Pas reçu ?</strong> Vérifiez le dossier spam de votre messagerie, ou{" "}
        {channel === "email" ? "votre adresse email" : "votre numéro"} si vous avez fait une faute de frappe.
        Le code reste valide 5 minutes.
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
