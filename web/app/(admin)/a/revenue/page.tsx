"use client";

import { useMemo, useState } from "react";
import {
  AlertOctagon, BarChart3, Banknote, Brain, Building2, Code2,
  CreditCard, History, Lock, Megaphone, MoreHorizontal, Palette,
  Percent, Plug, Power, Settings, ShieldCheck, Sparkles,
  Trash2, TrendingUp, Truck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { KpiCard } from "@/components/domain/kpi-card";
import { PrintHubAreaChart } from "@/components/charts/area-chart";
import { PrintHubDonut } from "@/components/charts/donut-chart";

import {
  useAuditLog,
  useCommissionRules,
  useCreateCommissionRule,
  useDeleteCommissionRule,
  useMonetizationConfig,
  useRevenueDashboard,
  useRevenueSources,
  useToggleSource,
  useUpdateCommissionRule,
  useUpdateMonetizationConfig,
  useValidateDsl,
  type CommissionRule,
  type RevenueSource,
} from "@/hooks/use-revenue";
import { formatCurrency } from "@/lib/utils";

// Mapping kind → icône (mêmes codes que côté backend seed_revenue_engine)
const KIND_ICON: Record<string, typeof Percent> = {
  commission: Percent,
  subscription: CreditCard,
  advertising: Megaphone,
  premium_service: Sparkles,
  ai: Brain,
  api: Plug,
  delivery: Truck,
  insurance: ShieldCheck,
  financing: Banknote,
  escrow: Lock,
  graphics_marketplace: Palette,
  business_intelligence: BarChart3,
  other: MoreHorizontal,
};

// ============================================================
// Page principale
// ============================================================
export default function AdminRevenuePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Revenue Engine
          </h1>
          <p className="text-sm text-muted-foreground">
            Pilote toutes les sources de revenus, règles de commission et configurations financières.
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">
            <TrendingUp className="mr-1.5 h-4 w-4" /> Tableau de bord
          </TabsTrigger>
          <TabsTrigger value="sources">
            <Power className="mr-1.5 h-4 w-4" /> Sources de revenus
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Code2 className="mr-1.5 h-4 w-4" /> Commissions
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="mr-1.5 h-4 w-4" /> Configuration
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="mr-1.5 h-4 w-4" /> Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <DashboardTab />
        </TabsContent>

        <TabsContent value="sources" className="space-y-4 pt-4">
          <SourcesTab />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 pt-4">
          <RulesTab />
        </TabsContent>

        <TabsContent value="config" className="space-y-4 pt-4">
          <ConfigTab />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4 pt-4">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Onglet 1 — Dashboard
// ============================================================
function DashboardTab() {
  const { data, isLoading } = useRevenueDashboard();

  const series = useMemo(() => {
    if (!data) return [];
    return data.series_90d.map((row) => ({
      label: row.day.slice(5),
      value: Number(row.total) || 0,
    }));
  }, [data]);

  const split = useMemo(() => {
    if (!data) return [];
    return data.by_source_30d.map((row) => ({
      name: row.label,
      value: Number(row.total) || 0,
    }));
  }, [data]);

  const fmtNum = (s: string | undefined) => {
    if (!s) return 0;
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Aujourd'hui"
          value={formatCurrency(fmtNum(data?.kpis.today))}
          icon={TrendingUp}
        />
        <KpiCard
          label="Cette semaine"
          value={formatCurrency(fmtNum(data?.kpis.week))}
          icon={TrendingUp}
        />
        <KpiCard
          label="Ce mois"
          value={formatCurrency(fmtNum(data?.kpis.month))}
          icon={Banknote}
        />
        <KpiCard
          label="Cette année"
          value={formatCurrency(fmtNum(data?.kpis.year))}
          icon={Banknote}
        />
        <KpiCard
          label="Cumul total"
          value={formatCurrency(fmtNum(data?.kpis.all_time))}
          icon={Banknote}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des revenus — 90 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            {series.length > 0 ? (
              <PrintHubAreaChart data={series} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Pas encore de revenu enregistré.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par source — 30 j</CardTitle>
          </CardHeader>
          <CardContent>
            {split.length > 0 ? (
              <PrintHubDonut data={split} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Aucune donnée.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top pays — 12 derniers mois</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.by_country_365d.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.by_country_365d.map((row) => (
                <div
                  key={row.country}
                  className="flex items-center justify-between rounded-md border bg-secondary/30 px-4 py-2"
                >
                  <span className="font-medium">{row.country || "—"}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(Number(row.total))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">Aucune donnée.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Onglet 2 — Sources de revenus
// ============================================================
function SourcesTab() {
  const { data: sources, isLoading } = useRevenueSources();
  const toggle = useToggleSource();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }
  if (!sources || sources.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune source de revenu. Lancez{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5">manage.py seed_revenue_engine</code>{" "}
          côté serveur.
        </CardContent>
      </Card>
    );
  }

  const onToggle = (source: RevenueSource) => {
    toggle.mutate(
      { code: source.code, reason: "" },
      {
        onSuccess: (updated) => {
          toast.success(`${updated.label} ${updated.is_enabled ? "activée" : "désactivée"}`);
        },
        onError: () => {
          toast.error("Échec du basculement");
        },
      },
    );
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {sources.map((s) => {
        const Icon = KIND_ICON[s.kind] ?? MoreHorizontal;
        return (
          <Card
            key={s.code}
            className={s.is_enabled ? "border-emerald-500/30" : "border-border/40 opacity-70"}
          >
            <CardContent className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      s.is_enabled
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.kind_label}</p>
                  </div>
                </div>
                <Badge variant={s.is_enabled ? "default" : "secondary"} className="text-[10px]">
                  {s.is_enabled ? "Activée" : "Off"}
                </Badge>
              </div>
              {s.description && (
                <p className="text-sm text-muted-foreground">{s.description}</p>
              )}
              <Button
                variant={s.is_enabled ? "outline" : "default"}
                size="sm"
                onClick={() => onToggle(s)}
                disabled={toggle.isPending}
                className="w-full"
              >
                <Power className="mr-1.5 h-3.5 w-3.5" />
                {s.is_enabled ? "Désactiver" : "Activer"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================================
// Onglet 3 — Règles de commission
// ============================================================
function RulesTab() {
  const { data: rules, isLoading } = useCommissionRules();
  const { data: sources } = useRevenueSources();
  const commissionSource = sources?.find((s) => s.code === "commission");

  const [editing, setEditing] = useState<Partial<CommissionRule> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const open = (rule: Partial<CommissionRule> | null) => {
    setEditing(rule);
    setDialogOpen(true);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Les règles sont évaluées dans l'ordre de priorité (plus petit = en premier).
        </p>
        <Button
          onClick={() =>
            open({
              source: commissionSource?.id,
              calculation_type: "percentage",
              percentage: "0.08",
              fixed_amount: "0",
              min_commission: "0",
              priority: 100,
              stacking: "stop_on_match",
              is_active: true,
              conditions: {},
            })
          }
        >
          Nouvelle règle
        </Button>
      </div>

      {!rules || rules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucune règle. Crée la première règle de commission.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <RuleRow key={rule.id} rule={rule} onEdit={() => open(rule)} />
          ))}
        </div>
      )}

      <RuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editing}
        defaultSourceId={commissionSource?.id}
      />
    </div>
  );
}

function RuleRow({ rule, onEdit }: { rule: CommissionRule; onEdit: () => void }) {
  const del = useDeleteCommissionRule();
  const summary =
    rule.calculation_type === "percentage"
      ? `${(Number(rule.percentage) * 100).toFixed(2)}%`
      : rule.calculation_type === "fixed"
        ? formatCurrency(Number(rule.fixed_amount))
        : `${formatCurrency(Number(rule.fixed_amount))} + ${(Number(rule.percentage) * 100).toFixed(2)}%`;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{rule.name}</p>
            <Badge variant={rule.is_active ? "default" : "secondary"} className="text-[10px]">
              {rule.is_active ? "Active" : "Off"}
            </Badge>
            <Badge variant="outline" className="text-[10px]">priorité {rule.priority}</Badge>
          </div>
          {rule.description && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{rule.description}</p>
          )}
          <p className="mt-1 text-xs">
            <span className="text-muted-foreground">Calcul :</span>{" "}
            <span className="font-medium">{summary}</span>
            {rule.min_commission && Number(rule.min_commission) > 0 && (
              <> · min {formatCurrency(Number(rule.min_commission))}</>
            )}
            {rule.max_commission && (
              <> · max {formatCurrency(Number(rule.max_commission))}</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>Éditer</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Supprimer "${rule.name}" ?`)) {
                del.mutate(rule.id, {
                  onSuccess: () => toast.success("Règle supprimée"),
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

function RuleDialog({
  open,
  onOpenChange,
  rule,
  defaultSourceId,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  rule: Partial<CommissionRule> | null;
  defaultSourceId?: string;
}) {
  const create = useCreateCommissionRule();
  const update = useUpdateCommissionRule();
  const validate = useValidateDsl();

  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [conditions, setConditions] = useState(
    rule?.conditions ? JSON.stringify(rule.conditions, null, 2) : "{}",
  );
  const [calculationType, setCalculationType] = useState<CommissionRule["calculation_type"]>(
    rule?.calculation_type ?? "percentage",
  );
  const [percentage, setPercentage] = useState(rule?.percentage ?? "0.08");
  const [fixedAmount, setFixedAmount] = useState(rule?.fixed_amount ?? "0");
  const [priority, setPriority] = useState(String(rule?.priority ?? 100));
  const [minCommission, setMinCommission] = useState(rule?.min_commission ?? "0");
  const [maxCommission, setMaxCommission] = useState(rule?.max_commission ?? "");
  const [isActive, setIsActive] = useState(rule?.is_active ?? true);

  // Re-sync inputs si on rouvre sur une autre règle
  useMemo(() => {
    if (!open) return;
    setName(rule?.name ?? "");
    setDescription(rule?.description ?? "");
    setConditions(rule?.conditions ? JSON.stringify(rule.conditions, null, 2) : "{}");
    setCalculationType(rule?.calculation_type ?? "percentage");
    setPercentage(rule?.percentage ?? "0.08");
    setFixedAmount(rule?.fixed_amount ?? "0");
    setPriority(String(rule?.priority ?? 100));
    setMinCommission(rule?.min_commission ?? "0");
    setMaxCommission(rule?.max_commission ?? "");
    setIsActive(rule?.is_active ?? true);
  }, [open, rule]);

  const submit = async () => {
    let parsedConditions: unknown;
    try {
      parsedConditions = conditions.trim() ? JSON.parse(conditions) : {};
    } catch {
      toast.error("DSL JSON invalide", { description: "Vérifie la syntaxe." });
      return;
    }
    const payload: Partial<CommissionRule> = {
      source: rule?.source ?? defaultSourceId,
      name, description,
      conditions: parsedConditions as Record<string, unknown>,
      calculation_type: calculationType,
      percentage, fixed_amount: fixedAmount,
      min_commission: minCommission,
      max_commission: maxCommission || null,
      priority: Number(priority) || 100,
      is_active: isActive,
    };
    try {
      if (rule?.id) {
        await update.mutateAsync({ id: rule.id, ...payload });
        toast.success("Règle mise à jour");
      } else {
        await create.mutateAsync(payload);
        toast.success("Règle créée");
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

  const onValidate = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(conditions);
    } catch {
      toast.error("JSON invalide");
      return;
    }
    const res = await validate.mutateAsync({ conditions: parsed, context: {} });
    if (res.ok) toast.success("DSL valide ✔");
    else toast.error("DSL refusé", { description: res.error });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rule?.id ? "Modifier la règle" : "Nouvelle règle"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Input
                id="priority" type="number"
                value={priority} onChange={(e) => setPriority(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description" rows={2}
              value={description} onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="conditions">Conditions (DSL JSON)</Label>
            <Textarea
              id="conditions" rows={6}
              className="font-mono text-xs"
              value={conditions} onChange={(e) => setConditions(e.target.value)}
              placeholder='{"all":[{"fact":"order.total","op":"gt","value":500000}]}'
            />
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Laisser <code>{"{}"}</code> = matche toujours.</span>
              <Button size="sm" variant="ghost" onClick={onValidate} disabled={validate.isPending}>
                Valider DSL
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Type de calcul</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={calculationType}
                onChange={(e) => setCalculationType(e.target.value as CommissionRule["calculation_type"])}
              >
                <option value="percentage">Pourcentage</option>
                <option value="fixed">Montant fixe</option>
                <option value="combined">Fixe + %</option>
              </select>
            </div>
            <div>
              <Label htmlFor="percentage">% (ex: 0.08)</Label>
              <Input
                id="percentage" type="number" step="0.0001"
                value={percentage} onChange={(e) => setPercentage(e.target.value)}
                disabled={calculationType === "fixed"}
              />
            </div>
            <div>
              <Label htmlFor="fixedAmount">Montant fixe</Label>
              <Input
                id="fixedAmount" type="number" step="0.01"
                value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)}
                disabled={calculationType === "percentage"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="min">Min commission</Label>
              <Input
                id="min" type="number" step="0.01"
                value={minCommission} onChange={(e) => setMinCommission(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="max">Max commission (vide = ∞)</Label>
              <Input
                id="max" type="number" step="0.01"
                value={maxCommission ?? ""} onChange={(e) => setMaxCommission(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active" type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            <Label htmlFor="is_active" className="cursor-pointer text-sm font-normal">
              Règle active
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {rule?.id ? "Enregistrer" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Onglet 4 — Configuration globale
// ============================================================
function ConfigTab() {
  const { data: config, isLoading } = useMonetizationConfig();
  const update = useUpdateMonetizationConfig();

  const [currency, setCurrency] = useState("");
  const [vat, setVat] = useState("");
  const [defaultRate, setDefaultRate] = useState("");
  const [defaultMin, setDefaultMin] = useState("");
  const [defaultMax, setDefaultMax] = useState("");
  const [killSwitch, setKillSwitch] = useState(false);
  const [logEval, setLogEval] = useState(true);

  useMemo(() => {
    if (!config) return;
    setCurrency(config.default_currency);
    setVat(config.default_vat_rate);
    setDefaultRate(config.default_commission_rate);
    setDefaultMin(config.default_commission_min);
    setDefaultMax(config.default_commission_max ?? "");
    setKillSwitch(config.commissions_kill_switch);
    setLogEval(config.log_evaluations);
  }, [config]);

  if (isLoading || !config) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  const save = async () => {
    try {
      await update.mutateAsync({
        default_currency: currency,
        default_vat_rate: vat,
        default_commission_rate: defaultRate,
        default_commission_min: defaultMin,
        default_commission_max: defaultMax || null,
        commissions_kill_switch: killSwitch,
        log_evaluations: logEval,
      });
      toast.success("Configuration enregistrée");
    } catch {
      toast.error("Échec de la mise à jour");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramétrage global du moteur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {killSwitch && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Kill switch actif</p>
              <p className="text-muted-foreground">
                Aucune commission n'est prélevée actuellement. À utiliser uniquement en cas d'urgence.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Devise par défaut</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>
          <div>
            <Label>TVA par défaut (ex. 0.18 = 18%)</Label>
            <Input value={vat} onChange={(e) => setVat(e.target.value)} />
          </div>
          <div>
            <Label>Commission par défaut (ex. 0.08)</Label>
            <Input value={defaultRate} onChange={(e) => setDefaultRate(e.target.value)} />
          </div>
          <div>
            <Label>Min commission</Label>
            <Input value={defaultMin} onChange={(e) => setDefaultMin(e.target.value)} />
          </div>
          <div>
            <Label>Max commission (vide = aucun plafond)</Label>
            <Input value={defaultMax} onChange={(e) => setDefaultMax(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" checked={logEval}
              onChange={(e) => setLogEval(e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            Logguer toutes les évaluations de règles (utile pour l'audit, plus de volume DB)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox" checked={killSwitch}
              onChange={(e) => setKillSwitch(e.target.checked)}
              className="h-4 w-4 rounded border accent-red-500"
            />
            <span className="text-destructive">
              Kill switch — désactiver TOUS les prélèvements de commission
            </span>
          </label>
        </div>

        <Button onClick={save} disabled={update.isPending}>
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Onglet 5 — Audit
// ============================================================
function AuditTab() {
  const { data: audit, isLoading } = useAuditLog();
  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (!audit || audit.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune modification enregistrée pour l'instant.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {audit.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{entry.actor_email ?? "Système"}</span>{" "}
                · <Badge variant="outline" className="text-[10px]">{entry.action}</Badge>{" "}
                · {entry.target_type} <span className="text-muted-foreground">{entry.target_label}</span>
              </p>
              {entry.reason && (
                <p className="mt-1 text-xs text-muted-foreground">« {entry.reason} »</p>
              )}
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
