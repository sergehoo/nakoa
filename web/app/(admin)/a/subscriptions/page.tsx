"use client";

import { useMemo, useState } from "react";
import { CreditCard, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminPlans,
  useAdminSubscriptions,
  useCreatePlan,
  useDeletePlan,
  useUpdatePlan,
  type Plan,
} from "@/hooks/use-subscriptions";
import { formatCurrency } from "@/lib/utils";

const EMPTY_PLAN: Partial<Plan> = {
  tier: "pro",
  code: "",
  name: "",
  description: "",
  tagline: "",
  monthly_price: "0",
  yearly_price: "0",
  currency: "XOF",
  commission_pct: "8",
  max_active_orders: 0,
  max_team_members: 0,
  max_products: 0,
  ai_messages_per_month: 0,
  trial_days: 0,
  features: [],
  is_active: true,
  is_public: true,
  is_highlight: false,
  target_role: "any",
  sort_order: 100,
  cta_label: "Choisir ce plan",
};

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Abonnements & Plans
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure les offres SaaS, suis les abonnés actifs et les churn.
        </p>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">
            <CreditCard className="mr-1.5 h-4 w-4" /> Plans
          </TabsTrigger>
          <TabsTrigger value="subscribers">
            <Users className="mr-1.5 h-4 w-4" /> Abonnés
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="pt-4">
          <PlansTab />
        </TabsContent>
        <TabsContent value="subscribers" className="pt-4">
          <SubscribersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Onglet Plans
// ============================================================
function PlansTab() {
  const { data: plans, isLoading } = useAdminPlans();
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {plans?.length ?? 0} plan(s) configuré(s). Glisse `sort_order` pour réordonner.
        </p>
        <Button onClick={() => {
          setEditing({ ...EMPTY_PLAN });
          setOpen(true);
        }}>
          Nouveau plan
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : !plans || plans.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun plan. Lance{" "}
            <code className="rounded bg-secondary px-1.5">manage.py seed_subscription_plans</code>.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              onEdit={() => {
                setEditing(plan);
                setOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <PlanDialog
        open={open}
        onOpenChange={setOpen}
        plan={editing}
      />
    </div>
  );
}

function PlanRow({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
  const del = useDeletePlan();
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{plan.name}</p>
            <Badge variant={plan.is_active ? "default" : "secondary"} className="text-[10px]">
              {plan.is_active ? "actif" : "inactif"}
            </Badge>
            {plan.is_highlight && (
              <Badge className="bg-pink-500/15 text-pink-600 text-[10px]">
                ★ populaire
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px]">
              {plan.target_role_label || plan.target_role}
            </Badge>
            <Badge variant="outline" className="text-[10px]">tier {plan.tier}</Badge>
            <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
              {plan.code}
            </code>
          </div>
          {plan.tagline && <p className="mt-0.5 text-xs text-muted-foreground">{plan.tagline}</p>}
          <p className="mt-1 text-xs">
            <span className="text-muted-foreground">Prix : </span>
            <span className="font-medium">
              {formatCurrency(Number(plan.monthly_price))}/mois
              {Number(plan.yearly_price) > 0 && (
                <> · {formatCurrency(Number(plan.yearly_price))}/an</>
              )}
            </span>
            <span className="text-muted-foreground"> · commission {plan.commission_pct}%</span>
            {plan.trial_days > 0 && (
              <span className="text-muted-foreground"> · {plan.trial_days} j essai</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>Éditer</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Supprimer le plan "${plan.name}" ?`)) {
                del.mutate(plan.id, {
                  onSuccess: () => toast.success("Plan supprimé"),
                  onError: () => toast.error("Échec de la suppression"),
                });
              }
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PlanDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  plan: Partial<Plan> | null;
}) {
  const create = useCreatePlan();
  const update = useUpdatePlan();

  const [form, setForm] = useState<Partial<Plan>>(plan ?? EMPTY_PLAN);
  // Sync à chaque ouverture
  useMemo(() => {
    if (open) setForm(plan ?? EMPTY_PLAN);
  }, [open, plan]);

  const set = <K extends keyof Plan>(key: K, value: Plan[K] | Partial<Plan>[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    try {
      if (plan?.id) {
        await update.mutateAsync({ ...form, id: plan.id });
        toast.success("Plan mis à jour");
      } else {
        await create.mutateAsync(form);
        toast.success("Plan créé");
      }
      onOpenChange(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: unknown } } };
      const detail = err?.response?.data?.detail;
      toast.error("Échec de l'enregistrement", {
        description: typeof detail === "string" ? detail : JSON.stringify(detail ?? "Erreur"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan?.id ? "Modifier le plan" : "Nouveau plan"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nom</Label>
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label>Code (slug)</Label>
              <Input value={form.code ?? ""} onChange={(e) => set("code", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Accroche</Label>
            <Input value={form.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tier</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.tier ?? "pro"}
                onChange={(e) => set("tier", e.target.value)}
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <Label>Cible</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.target_role ?? "any"}
                onChange={(e) => set("target_role", e.target.value)}
              >
                <option value="any">Tout le monde</option>
                <option value="customer">Particuliers</option>
                <option value="customer_corporate">Entreprises</option>
                <option value="printer">Imprimeurs</option>
                <option value="courier">Livreurs</option>
              </select>
            </div>
            <div>
              <Label>Devise</Label>
              <Input value={form.currency ?? "XOF"} onChange={(e) => set("currency", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Prix mensuel</Label>
              <Input
                type="number" step="0.01"
                value={form.monthly_price ?? "0"}
                onChange={(e) => set("monthly_price", e.target.value)}
              />
            </div>
            <div>
              <Label>Prix annuel</Label>
              <Input
                type="number" step="0.01"
                value={form.yearly_price ?? "0"}
                onChange={(e) => set("yearly_price", e.target.value)}
              />
            </div>
            <div>
              <Label>Commission %</Label>
              <Input
                type="number" step="0.01"
                value={form.commission_pct ?? "0"}
                onChange={(e) => set("commission_pct", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Essai (j)</Label>
              <Input
                type="number"
                value={form.trial_days ?? 0}
                onChange={(e) => set("trial_days", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Max produits</Label>
              <Input
                type="number"
                value={form.max_products ?? 0}
                onChange={(e) => set("max_products", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Max équipe</Label>
              <Input
                type="number"
                value={form.max_team_members ?? 0}
                onChange={(e) => set("max_team_members", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Ordre</Label>
              <Input
                type="number"
                value={form.sort_order ?? 100}
                onChange={(e) => set("sort_order", Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label>Features (1 par ligne)</Label>
            <Textarea
              rows={4}
              value={(form.features ?? []).join("\n")}
              onChange={(e) =>
                set("features", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))
              }
              placeholder="catalogue_etendu&#10;ai_assistant&#10;support_prio"
            />
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => set("is_active", e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              Actif
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_public ?? true}
                onChange={(e) => set("is_public", e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              Visible sur /pricing
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_highlight ?? false}
                onChange={(e) => set("is_highlight", e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              Mis en avant ★
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {plan?.id ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Onglet Abonnés
// ============================================================
function SubscribersTab() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: subs, isLoading } = useAdminSubscriptions(
    statusFilter ? { status: statusFilter } : undefined,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-sm">Statut :</Label>
        <select
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tous</option>
          <option value="trial">Essai</option>
          <option value="active">Active</option>
          <option value="past_due">Impayée</option>
          <option value="cancelled">Annulée</option>
          <option value="expired">Expirée</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : !subs || subs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun abonnement pour ce filtre.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/30">
                  <th className="px-4 py-2 text-left font-semibold">Email</th>
                  <th className="px-4 py-2 text-left font-semibold">Plan</th>
                  <th className="px-4 py-2 text-left font-semibold">Cycle</th>
                  <th className="px-4 py-2 text-left font-semibold">Statut</th>
                  <th className="px-4 py-2 text-left font-semibold">Fin période</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-secondary/20">
                    <td className="px-4 py-2">{s.subscriber_email ?? "—"}</td>
                    <td className="px-4 py-2">{s.plan_detail?.name ?? s.plan}</td>
                    <td className="px-4 py-2 text-xs uppercase">{s.cycle}</td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          s.status === "active"
                            ? "default"
                            : s.status === "cancelled" || s.status === "expired"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(s.current_period_end).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
