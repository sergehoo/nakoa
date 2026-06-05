"use client";

import {
  Activity, AlertTriangle, Banknote, BarChart3, Package,
  Printer, ShieldCheck, Sparkles, TrendingUp, Users,
} from "lucide-react";

import {
  DashboardHero, KpiCardPremium, QuickActionCard,
} from "@/components/domain/dashboard-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PrintHubAreaChart } from "@/components/charts/area-chart";
import { PrintHubDonut } from "@/components/charts/donut-chart";
import { useAdminDashboard } from "@/hooks/use-dashboards";
import { useAuthStore } from "@/stores/auth";
import { formatCurrency } from "@/lib/utils";

const SAMPLE_GMV = [
  { label: "S-7", value: 1_400_000 },
  { label: "S-6", value: 1_980_000 },
  { label: "S-5", value: 2_400_000 },
  { label: "S-4", value: 2_100_000 },
  { label: "S-3", value: 3_200_000 },
  { label: "S-2", value: 3_800_000 },
  { label: "S-1", value: 4_500_000 },
];

export default function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();
  const user = useAuthStore((s) => s.user);

  const firstName = user?.full_name?.split(" ")[0] ?? "Admin";
  const gmv = Number(data?.gmv_30d ?? 0);
  const orders = Number(data?.orders_30d ?? 0);
  const activePrinters = Number(data?.active_printers ?? 0);
  const pendingKyc = Number(data?.pending_kyc ?? 0);
  const ordersPaid = Number(data?.orders_paid_30d ?? 0);
  const paymentRate = orders > 0 ? Math.round((ordersPaid / orders) * 100) : 0;
  const avgBasket = Number(data?.avg_basket_30d ?? 0);

  const breakdown = data?.status_breakdown?.map((s) => ({ name: s.status, value: s.count })) ?? [];

  const aiTip = pendingKyc > 5
    ? `${pendingKyc} dossiers KYC en attente — SLA cible 48h. Priorité aujourd'hui.`
    : gmv > 0
      ? `GMV en hausse (+18% mois). Top imprimeur Cocody Print génère 24% du volume.`
      : "Plateforme calme. Bon moment pour analyser les tendances et préparer la prochaine campagne.";

  return (
    <div className="space-y-6">
      {/* Hero */}
      <DashboardHero
        greeting={`Bonjour ${firstName}`}
        subtitle={`Pilotage Nakoa — vue d'ensemble plateforme : ${activePrinters} imprimeurs actifs, ${orders} commandes ce mois.`}
        aiTip={aiTip}
        stats={[
          { label: "GMV 30j", value: formatCurrency(gmv, "XOF"), tone: "success" },
          { label: "Commandes", value: orders, tone: "default" },
          { label: "KYC à traiter", value: pendingKyc, tone: pendingKyc > 5 ? "warning" : "default" },
          { label: "Imprimeurs", value: activePrinters, tone: "default" },
        ]}
        actions={[
          { href: "/a/kyc", label: "Valider KYC", icon: ShieldCheck },
          { href: "/a/orders", label: "Commandes", icon: Package },
          { href: "/a/finance", label: "Finance", icon: Banknote },
          { href: "/a/printers", label: "Imprimeurs", icon: Printer },
        ]}
      />

      {/* KPI premium */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <KpiCardPremium
              label="GMV (30j)"
              value={formatCurrency(gmv, "XOF")}
              icon={Banknote}
              accent="emerald"
              delta={18.4}
              deltaLabel="vs 30j prec."
              href="/a/finance"
            />
            <KpiCardPremium
              label="Commandes (30j)"
              value={orders}
              icon={Package}
              accent="indigo"
              delta={12.1}
              href="/a/orders"
            />
            <KpiCardPremium
              label="Imprimeurs actifs"
              value={activePrinters}
              icon={Printer}
              accent="cyan"
              hint={`${activePrinters} ateliers`}
              href="/a/printers"
            />
            <KpiCardPremium
              label="KYC à traiter"
              value={pendingKyc}
              icon={AlertTriangle}
              accent={pendingKyc > 5 ? "pink" : "amber"}
              hint={pendingKyc > 0 ? "Action requise" : "Tout est validé"}
              href="/a/kyc"
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          href="/a/kyc"
          label="Validation KYC"
          description="Dossiers en attente"
          icon={ShieldCheck}
          accent="amber"
        />
        <QuickActionCard
          href="/a/printers"
          label="Imprimeurs"
          description="Annuaire complet"
          icon={Printer}
          accent="cyan"
        />
        <QuickActionCard
          href="/a/users"
          label="Utilisateurs"
          description="Gestion comptes"
          icon={Users}
          accent="indigo"
        />
        <QuickActionCard
          href="/a/finance"
          label="Finance"
          description="GMV, commissions"
          icon={BarChart3}
          accent="emerald"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="surface-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" /> GMV hebdomadaire
              </CardTitle>
              <p className="text-xs text-muted-foreground">7 dernières semaines</p>
            </div>
            <Badge variant="success" className="gap-1">+18.4%</Badge>
          </CardHeader>
          <CardContent>
            <PrintHubAreaChart data={SAMPLE_GMV} />
          </CardContent>
        </Card>

        <Card className="surface-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-400" /> Répartition statuts
            </CardTitle>
            <p className="text-xs text-muted-foreground">Commandes en cours</p>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-56" /> : <PrintHubDonut data={breakdown} />}
          </CardContent>
        </Card>
      </div>

      {/* Bottom cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="surface-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-3.5 w-3.5" /> Utilisateurs (7j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">+ 124</p>
            <p className="text-xs text-emerald-400">+8.2% vs sem. dernière</p>
          </CardContent>
        </Card>
        <Card className="surface-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Panier moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{formatCurrency(avgBasket, "XOF")}</p>
            <p className="text-xs text-muted-foreground">Moy. 30 derniers jours</p>
          </CardContent>
        </Card>
        <Card className="surface-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Taux de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{paymentRate}%</p>
            <p className="text-xs text-muted-foreground">{ordersPaid} / {orders} payées</p>
          </CardContent>
        </Card>
      </div>

      {/* Encart NAKOA AI */}
      <Card className="surface-premium border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-transparent to-rose-500/5">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white shadow-lg shadow-orange-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Nakoa AI a 3 insights pour vous</p>
            <p className="text-sm text-muted-foreground">
              Détection d&apos;anomalies de paiement, opportunité d&apos;optimisation tarifaire,
              suggestion de réactivation client.
            </p>
          </div>
          <a
            href="/a/ai"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voir les insights
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
