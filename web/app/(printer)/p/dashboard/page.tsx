"use client";

import {
  Activity, AlertTriangle, BarChart3, ClipboardList,
  FileText, Package, PlusCircle, ShoppingCart,
  Sparkles, Truck, Wallet,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import {
  DashboardHero, KpiCardPremium, QuickActionCard,
} from "@/components/domain/dashboard-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { usePrinterDashboard } from "@/hooks/use-dashboards";
import { useAuthStore } from "@/stores/auth";
import { formatCurrency } from "@/lib/utils";

const SAMPLE_SERIES = [
  { day: "Lun", orders: 4, revenue: 240000 },
  { day: "Mar", orders: 6, revenue: 380000 },
  { day: "Mer", orders: 3, revenue: 195000 },
  { day: "Jeu", orders: 8, revenue: 520000 },
  { day: "Ven", orders: 9, revenue: 605000 },
  { day: "Sam", orders: 5, revenue: 310000 },
  { day: "Dim", orders: 2, revenue: 120000 },
];

export default function PrinterDashboard() {
  const { data, isLoading } = usePrinterDashboard();
  const user = useAuthStore((s) => s.user);

  const firstName = user?.full_name?.split(" ")[0] ?? "Imprimeur";
  const ordersToAccept = Number(data?.to_accept ?? 0);
  const inProduction = Number(data?.in_production ?? 0);
  const ca30d = Number(data?.ca_30d ?? 0);
  const orders30d = Number(data?.orders_30d ?? 0);
  const quality = Number(data?.quality_score ?? 0);
  const onTime = Number(data?.on_time_rate ?? 0);
  const load = Number(data?.current_load_pct ?? 0);
  const wallet = Number(data?.wallet_balance ?? 0);

  const aiTip = ordersToAccept > 0
    ? `Vous avez ${ordersToAccept} commande${ordersToAccept > 1 ? "s" : ""} à accepter. Réponse rapide = score qualité préservé.`
    : load > 85
      ? `Charge atelier à ${load.toFixed(0)}%. Pensez à mettre à jour vos délais pour éviter les retards.`
      : `Tout est sous contrôle. Score qualité ${quality.toFixed(0)}/100, ${onTime.toFixed(0)}% à l'heure. Continuez !`;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <DashboardHero
        greeting={`Bonjour ${firstName}`}
        subtitle={`Voici un résumé de votre atelier — ${orders30d} commandes ce mois, ${inProduction} en production.`}
        aiTip={aiTip}
        stats={[
          { label: "À accepter", value: ordersToAccept, tone: ordersToAccept > 0 ? "warning" : "success" },
          { label: "En production", value: inProduction, tone: "default" },
          { label: "Score qualité", value: `${quality.toFixed(0)}`, hint: "/100", tone: quality >= 80 ? "success" : "warning" },
          { label: "CA 30j", value: formatCurrency(ca30d, "XOF"), tone: "default" },
        ]}
        actions={[
          { href: "/p/orders", label: "Voir les commandes", icon: ShoppingCart },
          { href: "/p/production", label: "Atelier", icon: ClipboardList },
          { href: "/p/catalog", label: "Mes prix", icon: BarChart3 },
        ]}
      />

      {/* KPIs animés */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <KpiCardPremium
              label="Chiffre d'affaires (30j)"
              value={formatCurrency(ca30d, "XOF")}
              icon={Wallet}
              accent="emerald"
              hint={`${orders30d} commandes`}
              href="/p/billing"
            />
            <KpiCardPremium
              label="Commandes en production"
              value={inProduction}
              icon={ClipboardList}
              accent="indigo"
              href="/p/production"
            />
            <KpiCardPremium
              label="À traiter"
              value={ordersToAccept}
              icon={Activity}
              accent={ordersToAccept > 0 ? "amber" : "cyan"}
              hint={ordersToAccept > 0 ? "Action requise" : "Vous êtes à jour"}
              href="/p/orders"
            />
            <KpiCardPremium
              label="Solde wallet"
              value={formatCurrency(wallet, "XOF")}
              icon={Wallet}
              accent="pink"
              hint="Disponible au retrait"
              href="/p/billing"
            />
          </>
        )}
      </div>

      {/* Quick actions row */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          href="/p/orders"
          label="Nouvelles commandes"
          description="Voir et accepter"
          icon={Package}
          accent="indigo"
        />
        <QuickActionCard
          href="/p/production"
          label="Mon atelier"
          description="Kanban production"
          icon={ClipboardList}
          accent="cyan"
        />
        <QuickActionCard
          href="/p/catalog"
          label="Catalogue & prix"
          description="Mettre à jour mes grilles"
          icon={BarChart3}
          accent="emerald"
        />
        <QuickActionCard
          href="/p/team"
          label="Équipe"
          description="Inviter, gérer"
          icon={Sparkles}
          accent="pink"
        />
      </div>

      {/* Activité + Performance */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Chart */}
        <Card className="surface-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activité 7 derniers jours</CardTitle>
              <p className="text-xs text-muted-foreground">
                Commandes reçues et chiffre d&apos;affaires
              </p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
            </Badge>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SAMPLE_SERIES} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradIndigo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(252 92% 70%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(252 92% 70%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" className="text-xs" axisLine={false} tickLine={false} />
                <YAxis className="text-xs" axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "hsla(252, 92%, 70%, 0.05)" }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(252 92% 70%)"
                  strokeWidth={2}
                  fill="url(#gradIndigo)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="surface-premium">
          <CardHeader>
            <CardTitle>Performance atelier</CardTitle>
            <p className="text-xs text-muted-foreground">
              Vos indicateurs clés vs SLA plateforme
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Score qualité</span>
                <strong className="font-mono">{quality.toFixed(0)}/100</strong>
              </div>
              <Progress value={quality} className="h-1.5" />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Respect des délais</span>
                <strong className="font-mono">{onTime.toFixed(0)}%</strong>
              </div>
              <Progress value={onTime} className="h-1.5" />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Charge actuelle</span>
                <strong className="font-mono">{load.toFixed(0)}%</strong>
              </div>
              <Progress value={load} className="h-1.5" />
              {load > 85 && (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                  <AlertTriangle className="h-3 w-3" /> Capacité presque saturée
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-gradient-to-br from-emerald-500/10 to-transparent p-3">
              <p className="text-xs text-muted-foreground">Estimation revenus 30 prochains jours</p>
              <p className="font-display text-2xl font-bold text-emerald-400">
                {formatCurrency(ca30d * 1.05, "XOF")}
              </p>
              <p className="text-[10px] text-muted-foreground">+5% prédit par Nakoa AI</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
