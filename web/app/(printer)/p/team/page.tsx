"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Crown, Eye, Loader2, Mail, ShieldCheck,
  UserMinus, UserPlus, Users, Wrench,
} from "lucide-react";
import { toast } from "sonner";

import {
  useMembers, useInviteMember, useUpdateMember, useRemoveMember,
  type PrinterMember,
} from "@/hooks/use-printer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { initials } from "@/lib/utils";

const ROLES = [
  { code: "owner", label: "Propriétaire", icon: Crown, color: "bg-amber-500", description: "Accès complet, y compris facturation et suppression du compte." },
  { code: "manager", label: "Manager", icon: ShieldCheck, color: "bg-blue-500", description: "Gère commandes, équipe, catalogue et grilles tarifaires." },
  { code: "operator", label: "Opérateur", icon: Wrench, color: "bg-emerald-500", description: "Travaille sur les commandes : production, statuts." },
  { code: "accountant", label: "Comptable", icon: ShieldCheck, color: "bg-rose-500", description: "Accès factures, paiements et retraits uniquement." },
  { code: "viewer", label: "Observateur", icon: Eye, color: "bg-slate-500", description: "Lecture seule sur dashboards et commandes." },
] as const;

function roleMeta(role: string) {
  return ROLES.find((r) => r.code === role) ?? ROLES[ROLES.length - 1];
}

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["owner", "manager", "operator", "accountant", "viewer"]),
});
type InviteForm = z.infer<typeof inviteSchema>;

function InviteDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const invite = useInviteMember();
  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "operator" },
  });

  const submit = async (data: InviteForm) => {
    try {
      await invite.mutateAsync(data);
      toast.success("Invitation envoyée", {
        description: `${data.email} recevra un email pour rejoindre l'équipe.`,
      });
      setOpen(false);
      reset();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string; email?: string[] } } };
      toast.error("Impossible d'inviter", {
        description: err?.response?.data?.detail ?? err?.response?.data?.email?.[0],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Un email d&apos;invitation sera envoyé. Le membre sera créé dès qu&apos;il aura accepté.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="prenom.nom@exemple.com"
                className="pl-9"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select
              value={watch("role")}
              onValueChange={(v) => setValue("role", v as InviteForm["role"], { shouldDirty: true })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.filter((r) => r.code !== "owner").map((r) => (
                  <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{roleMeta(watch("role")).description}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Envoyer l&apos;invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemberRow({ member }: { member: PrinterMember }) {
  const update = useUpdateMember();
  const remove = useRemoveMember();
  const meta = roleMeta(member.role);
  const Icon = meta.icon;

  const changeRole = async (newRole: string) => {
    try {
      await update.mutateAsync({ id: member.id, payload: { role: newRole as PrinterMember["role"] } });
      toast.success("Rôle mis à jour");
    } catch {
      toast.error("Impossible de changer le rôle");
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Retirer ${member.full_name || member.email} de l'équipe ?`)) return;
    try {
      await remove.mutateAsync(member.id);
      toast.success("Membre retiré");
    } catch {
      toast.error("Impossible de retirer le membre");
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center">
      <div className="flex items-center gap-3 md:flex-1">
        <Avatar>
          <AvatarFallback>{initials(member.full_name || member.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{member.full_name || member.email}</p>
          {member.full_name && <p className="truncate text-xs text-muted-foreground">{member.email}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={member.is_active ? "success" : "secondary"} className="gap-1">
              <Icon className="h-3 w-3" /> {meta.label}
            </Badge>
            {!member.is_active && <Badge variant="secondary">Invitation en attente</Badge>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:ml-auto">
        {member.role !== "owner" ? (
          <>
            <Select value={member.role} onValueChange={changeRole} disabled={update.isPending}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.filter((r) => r.code !== "owner").map((r) => (
                  <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost" size="icon"
              className="text-destructive"
              onClick={handleRemove}
              disabled={remove.isPending}
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Badge variant="default" className="gap-1">
            <Crown className="h-3 w-3" /> Propriétaire
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function PrinterTeamPage() {
  const { data: members, isLoading } = useMembers();
  const list = (members as PrinterMember[] | undefined) ?? [];
  const activeCount = list.filter((m) => m.is_active).length;
  const pendingCount = list.filter((m) => !m.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Équipe</h1>
          <p className="text-sm text-muted-foreground">
            Invitez vos collègues et définissez leurs droits sur la plateforme.
          </p>
        </div>
        <InviteDialog
          trigger={<Button><UserPlus className="mr-2 h-4 w-4" /> Inviter</Button>}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">membres actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">invitations en attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-success/10 text-success">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{ROLES.length}</p>
              <p className="text-xs text-muted-foreground">rôles disponibles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Aucun membre encore</p>
                <p className="text-sm text-muted-foreground">
                  Invitez votre premier collègue pour démarrer.
                </p>
              </div>
              <InviteDialog
                trigger={<Button><UserPlus className="mr-2 h-4 w-4" /> Inviter un membre</Button>}
              />
            </div>
          ) : (
            list.map((m) => <MemberRow key={m.id} member={m} />)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Référentiel des rôles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.code} className="flex items-start gap-3 rounded-md border p-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white ${r.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
