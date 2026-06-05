"use client";

import { useState } from "react";
import {
  AlertCircle, Building2, CheckCircle2, ChevronRight, Clock, FileText,
  Loader2, ShieldCheck, User, XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  useKycSubmissions, useApproveKyc, useRejectKyc, useRequestKycInfo,
  type KYCSubmission, type KYCStatus, type KYCType,
} from "@/hooks/use-kyc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// dialog imports déjà présents plus bas
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, initials } from "@/lib/utils";

function statusBadge(s: KYCStatus) {
  const map: Record<KYCStatus, { variant: "default" | "success" | "warning" | "destructive" | "secondary"; label: string; icon: typeof CheckCircle2 }> = {
    draft: { variant: "secondary", label: "Brouillon", icon: FileText },
    submitted: { variant: "warning", label: "À traiter", icon: Clock },
    under_review: { variant: "default", label: "En revue", icon: Clock },
    approved: { variant: "success", label: "Approuvé", icon: CheckCircle2 },
    rejected: { variant: "destructive", label: "Rejeté", icon: XCircle },
    needs_info: { variant: "warning", label: "Complément demandé", icon: AlertCircle },
  };
  const m = map[s];
  const Icon = m.icon;
  return (
    <Badge variant={m.variant} className="gap-1">
      <Icon className="h-3 w-3" /> {m.label}
    </Badge>
  );
}

function DocumentViewer({
  submission,
  open,
  onClose,
}: {
  submission: KYCSubmission;
  open: boolean;
  onClose: () => void;
}) {
  const [decisionNote, setDecisionNote] = useState("");
  const approve = useApproveKyc();
  const reject = useRejectKyc();
  const needsInfo = useRequestKycInfo();

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({ id: submission.id, note: decisionNote });
      toast.success("Dossier approuvé");
      onClose();
    } catch {
      toast.error("Échec de l'approbation");
    }
  };

  const handleReject = async () => {
    if (!decisionNote.trim()) {
      toast.error("Une raison de rejet est obligatoire");
      return;
    }
    try {
      await reject.mutateAsync({ id: submission.id, note: decisionNote });
      toast.success("Dossier rejeté");
      onClose();
    } catch {
      toast.error("Échec du rejet");
    }
  };

  const handleNeedsInfo = async () => {
    if (!decisionNote.trim()) {
      toast.error("Précise ce qui manque");
      return;
    }
    try {
      await needsInfo.mutateAsync({ id: submission.id, note: decisionNote });
      toast.success("Complément demandé");
      onClose();
    } catch {
      toast.error("Échec");
    }
  };

  const isPending = approve.isPending || reject.isPending || needsInfo.isPending;
  const TypeIcon = submission.type === "business" ? Building2 : User;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5" />
            {submission.type === "business" ? "KYB Imprimeur" : "KYC Client"}
          </DialogTitle>
          <DialogDescription>
            {submission.user_detail?.full_name || submission.user_detail?.email}
            {submission.submitted_at && (
              <> · Soumis le {formatDateTime(submission.submitted_at)}</>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Documents */}
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold">
              Documents fournis ({submission.documents.length})
            </p>
            {submission.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun document fourni.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {submission.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 truncate">
                      <p className="truncate text-sm font-medium capitalize">
                        {doc.kind.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">Voir le fichier</p>
                    </div>
                    {doc.is_validated && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Note de décision */}
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-semibold">
              Note de décision
            </label>
            <textarea
              id="note"
              rows={4}
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              placeholder="Explique ta décision (obligatoire pour rejet ou complément)…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleNeedsInfo}
            disabled={isPending}
          >
            {needsInfo.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertCircle className="mr-2 h-4 w-4" />
            )}
            Demander complément
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isPending}
          >
            {reject.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Rejeter
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isPending}
          >
            {approve.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Approuver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubmissionRow({ submission, onOpen }: { submission: KYCSubmission; onOpen: () => void }) {
  const TypeIcon = submission.type === "business" ? Building2 : User;
  const requiredDocs = submission.type === "business" ? 4 : 2;
  const providedDocs = submission.documents.length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 border-b p-4 text-left transition-colors last:border-b-0 hover:bg-secondary/50"
    >
      <Avatar>
        <AvatarFallback>
          {initials(submission.user_detail?.full_name || submission.user_detail?.email || "?")}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {submission.user_detail?.full_name || submission.user_detail?.email || "—"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            <TypeIcon className="h-3 w-3" />
            {submission.type === "business" ? "KYB Imprimeur" : "KYC Client"}
          </Badge>
          <span>{providedDocs}/{requiredDocs} documents</span>
          {submission.submitted_at && (
            <span>· Soumis {formatDateTime(submission.submitted_at)}</span>
          )}
        </div>
      </div>

      <div className="hidden md:block">{statusBadge(submission.status)}</div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

const ALL = "__all__";

export default function AdminKYCPage() {
  const [statusFilter, setStatusFilter] = useState<KYCStatus | typeof ALL>("submitted");
  const [typeFilter, setTypeFilter] = useState<KYCType | typeof ALL>(ALL);
  const [openSub, setOpenSub] = useState<KYCSubmission | null>(null);

  const { data, isLoading, error } = useKycSubmissions({
    status: statusFilter === ALL ? undefined : (statusFilter as KYCStatus),
    type: typeFilter === ALL ? undefined : (typeFilter as KYCType),
  });

  const list = (data as { results: KYCSubmission[] } | KYCSubmission[] | undefined);
  const submissions = Array.isArray(list) ? list : list?.results ?? [];

  // KPIs sur tout
  const { data: allData } = useKycSubmissions({});
  const all = Array.isArray(allData)
    ? (allData as KYCSubmission[])
    : (allData as { results: KYCSubmission[] } | undefined)?.results ?? [];
  const toReview = all.filter((s) => s.status === "submitted").length;
  const inReview = all.filter((s) => s.status === "under_review").length;
  const approved30d = all.filter((s) => s.status === "approved").length;
  const rejected30d = all.filter((s) => s.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Modération KYC / KYB</h1>
        <p className="text-sm text-muted-foreground">
          SLA cible : 48 heures ouvrées pour traiter une demande.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{toReview}</p>
              <p className="text-xs text-muted-foreground">à traiter</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{inReview}</p>
              <p className="text-xs text-muted-foreground">en cours de revue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{approved30d}</p>
              <p className="text-xs text-muted-foreground">approuvés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{rejected30d}</p>
              <p className="text-xs text-muted-foreground">rejetés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as KYCStatus | typeof ALL)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous statuts</SelectItem>
              <SelectItem value="submitted">À traiter</SelectItem>
              <SelectItem value="under_review">En revue</SelectItem>
              <SelectItem value="needs_info">Complément demandé</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as KYCType | typeof ALL)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous types</SelectItem>
              <SelectItem value="business">KYB Imprimeur uniquement</SelectItem>
              <SelectItem value="customer">KYC Client uniquement</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {submissions.length} demande{submissions.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">
              Erreur de chargement.
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="font-semibold">Rien à traiter</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Aucune demande ne correspond aux filtres.
              </p>
            </div>
          ) : (
            <div>
              {submissions.map((s) => (
                <SubmissionRow
                  key={s.id}
                  submission={s}
                  onOpen={() => setOpenSub(s)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {openSub && (
        <DocumentViewer
          submission={openSub}
          open
          onClose={() => setOpenSub(null)}
        />
      )}
    </div>
  );
}
