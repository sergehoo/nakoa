"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2,
  Search, Shield, ShieldAlert, ShieldOff, ShieldQuestion, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAdminPrinters, useUpdatePrinterStatus,
  type AdminPrinter,
} from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/use-debounce";

const ALL = "__all__";

const COUNTRIES = [
  { code: ALL, label: "Tous pays" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "SN", label: "Sénégal" },
  { code: "BJ", label: "Bénin" },
  { code: "TG", label: "Togo" },
  { code: "BF", label: "Burkina Faso" },
  { code: "ML", label: "Mali" },
  { code: "CM", label: "Cameroun" },
];

const STATUS_OPTIONS = [
  { code: ALL, label: "Tous statuts" },
  { code: "pending", label: "En attente" },
  { code: "active", label: "Actif" },
  { code: "probation", label: "Probation" },
  { code: "suspended", label: "Suspendu" },
  { code: "banned", label: "Banni" },
];

const KYC_OPTIONS = [
  { code: ALL, label: "Tous KYB" },
  { code: "pending", label: "Pending" },
  { code: "submitted", label: "Soumis" },
  { code: "approved", label: "Approuvé" },
  { code: "rejected", label: "Rejeté" },
];

function statusBadge(s: AdminPrinter["status"]) {
  const map: Record<AdminPrinter["status"], { variant: "success" | "warning" | "secondary" | "destructive" | "default"; label: string; icon: typeof CheckCircle2 }> = {
    pending: { variant: "secondary", label: "En attente", icon: Clock },
    active: { variant: "success", label: "Actif", icon: CheckCircle2 },
    probation: { variant: "warning", label: "Probation", icon: ShieldQuestion },
    suspended: { variant: "destructive", label: "Suspendu", icon: ShieldAlert },
    banned: { variant: "destructive", label: "Banni", icon: ShieldOff },
  };
  const m = map[s];
  const Icon = m.icon;
  return (
    <Badge variant={m.variant} className="gap-1">
      <Icon className="h-3 w-3" /> {m.label}
    </Badge>
  );
}

function kycBadge(s: AdminPrinter["kyc_status"]) {
  const map: Record<AdminPrinter["kyc_status"], { variant: "success" | "warning" | "secondary" | "destructive"; label: string }> = {
    approved: { variant: "success", label: "KYB ✓" },
    submitted: { variant: "warning", label: "KYB en revue" },
    rejected: { variant: "destructive", label: "KYB rejeté" },
    pending: { variant: "secondary", label: "KYB pending" },
  };
  const m = map[s];
  return <Badge variant={m.variant} className="text-[10px]">{m.label}</Badge>;
}

function StatusChangeDialog({
  printer,
  trigger,
}: {
  printer: AdminPrinter;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<AdminPrinter["status"]>(printer.status);
  const update = useUpdatePrinterStatus();

  const submit = async () => {
    try {
      await update.mutateAsync({ id: printer.id, status: newStatus });
      toast.success("Statut mis à jour");
      setOpen(false);
    } catch {
      toast.error("Échec de la mise à jour du statut");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer le statut</DialogTitle>
          <DialogDescription>
            {printer.trade_name || printer.legal_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={newStatus} onValueChange={(v) => setNewStatus(v as AdminPrinter["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="probation">Probation</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
              <SelectItem value="banned">Banni</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-md border bg-secondary/30 p-3 text-sm">
            <p className="font-semibold">Impact :</p>
            <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
              {newStatus === "active" && <li>✓ Reçoit de nouvelles commandes via le matching.</li>}
              {newStatus === "probation" && <li>⚠ Visible mais surveillé. SLA monitoré.</li>}
              {newStatus === "suspended" && <li>🚫 Plus aucun nouveau matching. Commandes en cours continuent.</li>}
              {newStatus === "banned" && <li>⛔ Bloqué définitivement, retiré de l&apos;annuaire public.</li>}
              {newStatus === "pending" && <li>⏳ KYB pas encore validé, en attente.</li>}
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={update.isPending}>
            {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrinterRow({ printer }: { printer: AdminPrinter }) {
  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-b-0 lg:flex-row lg:items-center">
      <div className="flex items-center gap-3 lg:w-72">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{printer.trade_name || printer.legal_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {printer.city || "—"} · {printer.country}
          </p>
          {printer.owner_detail && (
            <p className="truncate text-xs text-muted-foreground">{printer.owner_detail.email}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {statusBadge(printer.status)}
        {kycBadge(printer.kyc_status)}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground lg:ml-auto">
        <div className="flex items-center gap-1">
          <Shield className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{Number(printer.quality_score).toFixed(0)}</span>/100
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{Number(printer.on_time_rate).toFixed(0)}%</span> on-time
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{Number(printer.current_load_pct).toFixed(0)}%</span> charge
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusChangeDialog
          printer={printer}
          trigger={<Button size="sm" variant="outline">Statut</Button>}
        />
        <Button asChild size="sm" variant="ghost">
          <Link href={`/a/printers/${printer.id}`}>Détail</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AdminPrintersPage() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [kyc, setKyc] = useState(ALL);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const filters = {
    page,
    page_size: 25,
    search: debouncedSearch || undefined,
    country: country === ALL ? undefined : country,
    status: status === ALL ? undefined : status,
    kyc_status: kyc === ALL ? undefined : kyc,
  };

  const { data, isLoading, isFetching, error } = useAdminPrinters(filters);
  const printers = data?.results ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 25));

  // KPIs (calculés sur la page courante — basique mais utile)
  const activeCount = printers.filter((p) => p.status === "active").length;
  const probationCount = printers.filter((p) => p.status === "probation").length;
  const suspendedCount = printers.filter((p) => ["suspended", "banned"].includes(p.status)).length;
  const pendingKyc = printers.filter((p) => ["pending", "submitted"].includes(p.kyc_status)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Imprimeurs</h1>
        <p className="text-sm text-muted-foreground">
          Annuaire des ateliers partenaires : statut, KYB, performance.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">actifs (page)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              <ShieldQuestion className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{probationCount}</p>
              <p className="text-xs text-muted-foreground">en probation</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{suspendedCount}</p>
              <p className="text-xs text-muted-foreground">suspendus/bannis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{pendingKyc}</p>
              <p className="text-xs text-muted-foreground">KYB à traiter</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={country} onValueChange={(v) => { setCountry(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={kyc} onValueChange={(v) => { setKyc(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="KYB" /></SelectTrigger>
            <SelectContent>
              {KYC_OPTIONS.map((s) => <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Liste */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {isLoading ? "Chargement…" : `${total} imprimeur${total > 1 ? "s" : ""}`}
            {isFetching && !isLoading && (
              <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">
              Erreur de chargement. L&apos;endpoint <code>/printers/profile/</code> en mode admin doit accepter les filtres demandés.
            </div>
          ) : printers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucun imprimeur ne correspond aux filtres.
            </div>
          ) : (
            <div>{printers.map((p) => <PrinterRow key={p.id} printer={p} />)}</div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} · {total} résultats
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Précédent
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Suivant <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
