"use client";

import { Activity, AlertTriangle, Banknote, Package, Printer, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/domain/kpi-card";
import { PrintHubAreaChart } from "@/components/charts/area-chart";
import { PrintHubDonut } from "@/components/charts/donut-chart";
import { useAdminDashboard } from "@/hooks/use-dashboards";
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

  const breakdown =
    data?.status_breakdown?.map((s) => ({ name: s.status, value: s.count })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Pilotage plateforme</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble Nakoa — 30 derniers jours.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard label="GMV (30j)" value={formatCurrency(Number(data?.gmv_30d ?? 0))} icon={Banknote} delta={{ value: "+18.4 %", positive: true }} />
            <KpiCard label="Commandes (30j)" value={data?.orders_30d ?? 0} icon={Package} delta={{ value: "+12 %", positive: true }} />
            <KpiCard label="Imprimeurs actifs" value={data?.active_printers ?? 0} icon={Printer} />
            <KpiCard label="KYC en attente" value={data?.pending_kyc ?? 0} icon={AlertTriangle} delta={{ value: "À traiter", positive: false }} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> GMV hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PrintHubAreaChart data={SAMPLE_GMV} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Répartition statuts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-56" /> : <PrintHubDonut data={breakdown} />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Utilisateurs (7j)
            </CardTitle>
          </CardHeader>
          <CardContent className="font-display text-3xl font-bold">+ 124</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Panier moyen</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-3xl font-bold">
            {formatCurrency(Number(data?.avg_basket_30d ?? 0))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Taux de paiement</CardTitle>
          </CardHeader>
          <CardContent className="font-display text-3xl font-bold">
            {data && data.orders_30d ? Math.round((Number(data.orders_paid_30d) / data.orders_30d) * 100) : 0}%
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
