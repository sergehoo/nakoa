"use client";

import { useState } from "react";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Loader2, MailCheck, PhoneCall,
  Search, ShieldAlert, ShieldCheck, UserCheck, UserX,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAdminUsers, useSuspendUser, useActivateUser,
  type AdminUserListItem,
} from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, initials } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

const ALL = "__all__";

const ROLES = [
  { code: ALL, label: "Tous les rôles" },
  { code: "customer", label: "Client particulier" },
  { code: "customer_corporate", label: "Client entreprise" },
  { code: "printer", label: "Imprimeur" },
  { code: "printer_agent", label: "Agent imprimeur" },
  { code: "courier", label: "Livreur" },
  { code: "admin", label: "Admin" },
  { code: "support", label: "Support" },
];

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

const STATUS = [
  { code: ALL, label: "Tous" },
  { code: "active", label: "Actifs" },
  { code: "suspended", label: "Suspendus" },
  { code: "inactive", label: "Inactifs (non vérifiés)" },
];

function roleBadge(role: string) {
  const map: Record<string, { variant: "default" | "secondary" | "success" | "warning" | "destructive"; label: string }> = {
    customer: { variant: "secondary", label: "Client" },
    customer_corporate: { variant: "secondary", label: "Client B2B" },
    printer: { variant: "default", label: "Imprimeur" },
    printer_agent: { variant: "default", label: "Agent" },
    courier: { variant: "default", label: "Livreur" },
    admin: { variant: "destructive", label: "Admin" },
    super_admin: { variant: "destructive", label: "Super Admin" },
    support: { variant: "warning", label: "Support" },
    accountant: { variant: "secondary", label: "Comptable" },
  };
  const m = map[role] ?? { variant: "secondary" as const, label: role };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function UserRow({ user }: { user: AdminUserListItem }) {
  const suspend = useSuspendUser();
  const activate = useActivateUser();

  const handleSuspend = async () => {
    const reason = prompt("Motif de suspension (optionnel) :") ?? "";
    try {
      await suspend.mutateAsync({ id: user.id, reason });
      toast.success("Utilisateur suspendu");
    } catch {
      toast.error("Échec de la suspension");
    }
  };

  const handleActivate = async () => {
    try {
      await activate.mutateAsync(user.id);
      toast.success("Utilisateur réactivé");
    } catch {
      toast.error("Échec de la réactivation");
    }
  };

  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-b-0 md:flex-row md:items-center">
      <div className="flex items-center gap-3 md:flex-1">
        <Avatar>
          <AvatarFallback>{initials(user.full_name || user.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user.full_name || "—"}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        {roleBadge(user.primary_role)}
        <Badge variant="secondary">{user.country || "—"}</Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {user.is_email_verified && <MailCheck className="h-3.5 w-3.5 text-success" />}
          {user.is_phone_verified && <PhoneCall className="h-3.5 w-3.5 text-success" />}
          {user.two_factor_enabled && <ShieldCheck className="h-3.5 w-3.5 text-success" />}
          <span className="ml-1">KYC {user.kyc_level}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:ml-auto md:w-64 md:justify-end">
        {user.is_suspended ? (
          <Badge variant="destructive" className="gap-1">
            <ShieldAlert className="h-3 w-3" /> Suspendu
          </Badge>
        ) : user.is_active ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Actif
          </Badge>
        ) : (
          <Badge variant="secondary">Inactif</Badge>
        )}
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Depuis {formatDate(user.created_at)}
        </span>
        {user.is_suspended ? (
          <Button
            size="sm" variant="outline"
            onClick={handleActivate}
            disabled={activate.isPending}
          >
            <UserCheck className="mr-1 h-3.5 w-3.5" /> Réactiver
          </Button>
        ) : (
          <Button
            size="sm" variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleSuspend}
            disabled={suspend.isPending}
          >
            <UserX className="mr-1 h-3.5 w-3.5" /> Suspendre
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState(ALL);
  const [country, setCountry] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const filters = {
    page,
    page_size: 25,
    search: debouncedSearch || undefined,
    primary_role: role === ALL ? undefined : role,
    country: country === ALL ? undefined : country,
    is_suspended: status === "suspended" ? true : undefined,
    is_active: status === "inactive" ? false : status === "active" ? true : undefined,
  };

  const { data, isLoading, isFetching, error } = useAdminUsers(filters);
  const users = data?.results ?? [];
  const total = data?.count ?? 0;
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Annuaire complet : clients, imprimeurs, livreurs, équipes internes.
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par email, nom, téléphone…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Rôle" /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={(v) => { setCountry(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              {STATUS.map((s) => <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Liste */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {isLoading ? "Chargement…" : `${total} utilisateur${total > 1 ? "s" : ""}`}
            {isFetching && !isLoading && (
              <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">
              Erreur de chargement. Vérifie que l&apos;endpoint <code>/accounts/admin/users/</code> existe côté backend.
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aucun utilisateur ne correspond aux filtres.
            </div>
          ) : (
            <div>{users.map((u) => <UserRow key={u.id} user={u} />)}</div>
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
