"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useConfirm2FA, useSetup2FA } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TwoFactorPage() {
  const setup = useSetup2FA();
  const confirm = useConfirm2FA();
  const [secret, setSecret] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const onSetup = async () => {
    const data = await setup.mutateAsync();
    setSecret(data.secret);
    setProvisioningUri(data.provisioning_uri);
    setBackupCodes(data.backup_codes);
  };

  const onConfirm = async () => {
    try {
      await confirm.mutateAsync(code);
      toast.success("2FA activé !");
    } catch {
      toast.error("Code invalide");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Activer la 2FA</h1>
        <p className="text-sm text-muted-foreground">
          Renforcez la sécurité de votre compte avec une application d&apos;authentification.
        </p>
      </div>

      {!secret ? (
        <Button onClick={onSetup} size="lg" className="w-full" disabled={setup.isPending}>
          {setup.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Générer un secret
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Secret (à scanner dans Google Authenticator)</p>
            <code className="mt-1 break-all font-mono text-sm">{secret}</code>
          </div>
          <div className="rounded-lg border bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground">Codes de secours (à conserver)</p>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((c) => <code key={c}>{c}</code>)}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code de vérification</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123 456" />
          </div>
          <Button onClick={onConfirm} size="lg" className="w-full" disabled={confirm.isPending || code.length < 6}>
            Confirmer l&apos;activation
          </Button>
        </div>
      )}
    </div>
  );
}
