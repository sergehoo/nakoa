"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";

import { api } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "failed" | "pending";

function PaymentCallbackContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Vérification de votre paiement…");

  useEffect(() => {
    // Paystack renvoie ?reference=PAY_xxx&trxref=PAY_xxx
    const ref = search.get("reference") || search.get("trxref");
    if (!ref) {
      setStatus("failed");
      setMessage("Référence de paiement absente. Si vous avez payé, contactez le support.");
      return;
    }

    const verify = async () => {
      try {
        const { data } = await api.get("/payments/verify/", {
          params: { reference: ref },
        });
        if (data.status === "captured" || data.status === "succeeded") {
          setStatus("success");
          setMessage("Paiement confirmé. Votre commande est en cours de traitement.");
          // Redirection automatique après 3s
          setTimeout(() => router.push(`/orders/${id}`), 3000);
        } else if (data.status === "failed") {
          setStatus("failed");
          setMessage(data.failed_reason || "Le paiement a échoué.");
        } else {
          setStatus("pending");
          setMessage("Paiement en attente de confirmation. Cela peut prendre quelques instants.");
        }
      } catch {
        setStatus("failed");
        setMessage("Impossible de vérifier le paiement. Réessayez depuis vos commandes.");
      }
    };

    verify();
  }, [id, router, search]);

  return (
    <div className="mx-auto max-w-md py-12">
      <Card className="surface-premium">
        <CardContent className="space-y-4 p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-400" />
              <p className="font-semibold">Vérification en cours…</p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="font-display text-xl font-bold">Paiement confirmé !</p>
              <p className="text-sm text-muted-foreground">{message}</p>
              <p className="text-xs text-muted-foreground">Redirection vers votre commande…</p>
              <Button asChild className="mt-4">
                <Link href={`/orders/${id}`}>Voir ma commande maintenant</Link>
              </Button>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5">
                <AlertCircle className="h-7 w-7 text-amber-400" />
              </div>
              <p className="font-display text-xl font-bold">Paiement en attente</p>
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button asChild variant="outline">
                <Link href={`/orders/${id}`}>Suivre ma commande</Link>
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-rose-500/5">
                <XCircle className="h-7 w-7 text-rose-400" />
              </div>
              <p className="font-display text-xl font-bold">Paiement échoué</p>
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="flex gap-2 justify-center pt-2">
                <Button asChild variant="outline">
                  <Link href={`/orders/${id}`}>Ma commande</Link>
                </Button>
                <Button asChild>
                  <Link href={`/orders/${id}/checkout`}>Réessayer</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Fallback() {
  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-400" />
          <p className="mt-3 text-sm text-muted-foreground">Préparation de la vérification…</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
