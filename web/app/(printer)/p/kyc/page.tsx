"use client";

import { useState } from "react";
import {
  AlertCircle, CheckCircle2, Clock, FileText, Loader2,
  Send, ShieldCheck, Trash2, Upload, XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  useKycSubmissions, useCreateKycSubmission, useUploadKycDocument,
  useDeleteKycDocument, useSubmitKyc,
  type KYCSubmission, type KYCDocument,
} from "@/hooks/use-kyc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const KYB_DOCUMENT_KINDS: { kind: KYCDocument["kind"]; label: string; description: string; required: boolean }[] = [
  { kind: "rccm", label: "RCCM", description: "Registre du commerce et du crédit mobilier", required: true },
  { kind: "tax_cert", label: "Attestation fiscale", description: "Justificatif d'immatriculation fiscale", required: true },
  { kind: "id_card", label: "CNI du dirigeant", description: "Carte d'identité du représentant légal", required: true },
  { kind: "bank_rib", label: "RIB", description: "Relevé d'identité bancaire pour les versements", required: true },
  { kind: "proof_address", label: "Justificatif d'adresse", description: "Facture EDF, eau, contrat de bail < 3 mois", required: false },
  { kind: "workshop_photo", label: "Photo atelier", description: "Photo de votre atelier (machines visibles)", required: false },
];

function StatusBadge({ status }: { status: KYCSubmission["status"] }) {
  const map: Record<KYCSubmission["status"], { variant: "success" | "secondary" | "warning" | "destructive" | "default"; label: string; icon: typeof CheckCircle2 }> = {
    draft: { variant: "secondary", label: "Brouillon", icon: FileText },
    submitted: { variant: "default", label: "Soumis", icon: Clock },
    under_review: { variant: "default", label: "En revue", icon: Clock },
    approved: { variant: "success", label: "Approuvé", icon: CheckCircle2 },
    rejected: { variant: "destructive", label: "Rejeté", icon: XCircle },
    needs_info: { variant: "warning", label: "Complément demandé", icon: AlertCircle },
  };
  const m = map[status];
  const Icon = m.icon;
  return (
    <Badge variant={m.variant} className="gap-1">
      <Icon className="h-3 w-3" /> {m.label}
    </Badge>
  );
}

function DocumentSlot({
  submissionId,
  kind,
  label,
  description,
  required,
  existing,
  canEdit,
}: {
  submissionId: string;
  kind: KYCDocument["kind"];
  label: string;
  description: string;
  required: boolean;
  existing?: KYCDocument;
  canEdit: boolean;
}) {
  const upload = useUploadKycDocument();
  const del = useDeleteKycDocument();
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    try {
      await upload.mutateAsync({ submission: submissionId, kind, file });
      toast.success(`${label} téléversé`);
      setFile(null);
    } catch {
      toast.error(`Échec téléversement ${label}`);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!confirm(`Supprimer ${label} ?`)) return;
    try {
      await del.mutateAsync(existing.id);
      toast.success("Document supprimé");
    } catch {
      toast.error("Impossible de supprimer");
    }
  };

  return (
    <Card className={cn(existing && "border-success/50 bg-success/5")}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{label}</p>
              {required && <Badge variant="secondary" className="text-[10px]">Requis</Badge>}
              {existing?.is_validated && (
                <Badge variant="success" className="gap-1 text-[10px]">
                  <CheckCircle2 className="h-3 w-3" /> Validé
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        {existing ? (
          <div className="flex items-center justify-between gap-2 rounded-md bg-background p-2 text-sm">
            <a
              href={existing.file}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              Voir le document
            </a>
            {canEdit && (
              <Button
                size="icon" variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={handleDelete}
                disabled={del.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ) : canEdit ? (
          <div className="flex items-center gap-2">
            <input
              id={`f-${kind}`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <label
              htmlFor={`f-${kind}`}
              className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-dashed p-2 text-sm hover:bg-secondary/50"
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              {file ? file.name : "Choisir un fichier"}
            </label>
            {file && (
              <Button size="sm" onClick={handleUpload} disabled={upload.isPending}>
                {upload.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Envoyer
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Non fourni</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function PrinterKycPage() {
  const { data: subs, isLoading } = useKycSubmissions({ type: "business" });
  const list = (subs as { results: KYCSubmission[] } | KYCSubmission[] | undefined);
  const submissions = Array.isArray(list) ? list : list?.results ?? [];
  const current = submissions[0]; // une seule soumission KYB par imprimeur

  const create = useCreateKycSubmission();
  const submit = useSubmitKyc();

  const handleCreate = async () => {
    try {
      await create.mutateAsync({ type: "business" });
      toast.success("Dossier KYB créé");
    } catch {
      toast.error("Impossible de créer le dossier");
    }
  };

  const handleSubmit = async () => {
    if (!current) return;
    if (!confirm("Soumettre votre dossier KYB pour validation ?")) return;
    try {
      await submit.mutateAsync(current.id);
      toast.success("Dossier soumis", {
        description: "Notre équipe revient vers vous sous 48h.",
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error("Impossible de soumettre", {
        description: err?.response?.data?.detail ?? "Vérifiez que tous les documents requis sont fournis.",
      });
    }
  };

  if (isLoading) return <Skeleton className="h-96" />;

  const requiredKinds = KYB_DOCUMENT_KINDS.filter((d) => d.required).map((d) => d.kind);
  const providedRequired = current
    ? requiredKinds.filter((k) => current.documents.some((d) => d.kind === k))
    : [];
  const progress = (providedRequired.length / requiredKinds.length) * 100;

  const canEdit = !current || ["draft", "needs_info"].includes(current.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Vérification KYB</h1>
        <p className="text-sm text-muted-foreground">
          Validez votre identité d&apos;entreprise pour accepter des paiements et apparaître publiquement.
        </p>
      </div>

      {!current ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="max-w-md space-y-2">
              <p className="font-display text-xl font-semibold">Démarrer la vérification</p>
              <p className="text-sm text-muted-foreground">
                Vous devrez fournir 4 documents requis (RCCM, attestation fiscale, CNI dirigeant, RIB).
                Notre équipe vérifie votre dossier en moins de 48h.
              </p>
            </div>
            <Button size="lg" onClick={handleCreate} disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Commencer la vérification
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* En-tête statut + progress */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dossier KYB</p>
                  <div className="mt-1 flex items-center gap-3">
                    <StatusBadge status={current.status} />
                    {current.submitted_at && (
                      <span className="text-xs text-muted-foreground">
                        Soumis le {formatDateTime(current.submitted_at)}
                      </span>
                    )}
                  </div>
                </div>
                {canEdit && providedRequired.length === requiredKinds.length && (
                  <Button onClick={handleSubmit} disabled={submit.isPending}>
                    {submit.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Soumettre pour validation
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Documents requis</span>
                  <span className="font-medium">
                    {providedRequired.length} / {requiredKinds.length}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {current.decision_note && (
                <div
                  className={cn(
                    "rounded-md border p-3 text-sm",
                    current.status === "rejected" && "border-destructive/50 bg-destructive/5",
                    current.status === "needs_info" && "border-amber-500/50 bg-amber-500/5",
                  )}
                >
                  <p className="font-semibold">Note de l&apos;équipe Nakoa :</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                    {current.decision_note}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {KYB_DOCUMENT_KINDS.map((slot) => {
                  const existing = current.documents.find((d) => d.kind === slot.kind);
                  return (
                    <DocumentSlot
                      key={slot.kind}
                      submissionId={current.id}
                      kind={slot.kind}
                      label={slot.label}
                      description={slot.description}
                      required={slot.required}
                      existing={existing}
                      canEdit={canEdit}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ce que nous vérifions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <div className="space-y-1">
            <p className="font-semibold">Identité de l&apos;entreprise</p>
            <p className="text-muted-foreground">RCCM, n° fiscal, raison sociale conformes au registre officiel.</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Identité du dirigeant</p>
            <p className="text-muted-foreground">Liveness selfie + pièce d&apos;identité du représentant légal.</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Compte de versement</p>
            <p className="text-muted-foreground">RIB ou Mobile Money pour percevoir vos paiements.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
