"use client";

import { Banknote, CreditCard, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/domain/kpi-card";
import { PrintHubAreaChart } from "@/components/charts/area-chart";
import { PrintHubDonut } from "@/components/charts/donut-chart";
import { useAdminDashboard } from "@/hooks/use-dashboards";
import { formatCurrency } from "@/lib/utils";

const REVENUE_TREND = [
  { label: "Jan", value: 2_100_000 },
  { label: "Fév", value: 2_900_000 },
  { label: "Mar", value: 3_400_000 },
  { label: "Avr", value: 4_100_000 },
  { label: "Mai", value: 5_800_000 },
];

const PROVIDER_SPLIT = [
  { name: "CinetPay", value: 42 },
  { name: "Wave", value: 28 },
  { name: "Stripe", value: 14 },
  { name: "Orange Money", value: 11 },
  { name: "MTN MoMo", value: 5 },
];

export default function AdminFinancePage() {
  const { data } = useAdminDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Finance</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="GMV 30j" value={formatCurrency(Number(data?.gmv_30d ?? 0))} icon={Banknote} />
        <KpiCard label="Commission plateforme" value={formatCurrency(Number(data?.gmv_30d ?? 0) * 0.1)} icon={TrendingUp} />
        <KpiCard label="Payouts à débloquer" value={formatCurrency(2_400_000)} icon={Wallet} />
        <KpiCard label="Frais providers" value={formatCurrency(180_000)} icon={CreditCard} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Évolution mensuelle</CardTitle></CardHeader>
          <CardContent>
            <PrintHubAreaChart data={REVENUE_TREND} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Répartition providers</CardTitle></CardHeader>
          <CardContent><PrintHubDonut data={PROVIDER_SPLIT} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
