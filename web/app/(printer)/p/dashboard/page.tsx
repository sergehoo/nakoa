"use client";

import { Activity, ClipboardList, ShoppingCart, Wallet } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/domain/kpi-card";
import { Progress } from "@/components/ui/progress";
import { usePrinterDashboard } from "@/hooks/use-dashboards";
import { formatCurrency } from "@/lib/utils";

const SAMPLE_SERIES = [
  { day: "Lun", orders: 4 },
  { day: "Mar", orders: 6 },
  { day: "Mer", orders: 3 },
  { day: "Jeu", orders: 8 },
  { day: "Ven", orders: 9 },
  { day: "Sam", orders: 5 },
  { day: "Dim", orders: 2 },
];

export default function PrinterDashboard() {
  const { data, isLoading } = usePrinterDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Pilotez votre atelier en temps réel.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard label="Chiffre d'affaires (30j)" value={formatCurrency(Number(data?.ca_30d ?? 0))} icon={Wallet} />
            <KpiCard label="Commandes (30j)" value={data?.orders_30d ?? 0} icon={ShoppingCart} />
            <KpiCard label="En production" value={data?.in_production ?? 0} icon={ClipboardList} />
            <KpiCard label="À accepter" value={data?.to_accept ?? 0} icon={Activity} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Activité de la semaine</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SAMPLE_SERIES}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip cursor={{ fill: "hsl(var(--secondary))" }} />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Performance atelier</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm"><span>Score qualité</span><strong>{data?.quality_score}/100</strong></div>
              <Progress value={Number(data?.quality_score ?? 0)} className="mt-1" />
            </div>
            <div>
              <div className="flex justify-between text-sm"><span>Respect des délais</span><strong>{data?.on_time_rate}%</strong></div>
              <Progress value={Number(data?.on_time_rate ?? 0)} className="mt-1" />
            </div>
            <div>
              <div className="flex justify-between text-sm"><span>Charge actuelle</span><strong>{data?.current_load_pct}%</strong></div>
              <Progress value={Number(data?.current_load_pct ?? 0)} className="mt-1" />
            </div>
            <div className="rounded-lg border bg-secondary/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">Solde wallet</p>
              <p className="font-display text-xl font-bold">{formatCurrency(Number(data?.wallet_balance ?? 0))}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
