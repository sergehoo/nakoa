"use client";

import Link from "next/link";
import {
  ArrowRight, Boxes, FileText, Package, Plus,
  ShoppingBag, Sparkles, Truck, Wallet,
} from "lucide-react";

import {
  DashboardHero, KpiCardPremium, QuickActionCard,
} from "@/components/domain/dashboard-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/domain/order-status-badge";
import { useCustomerDashboard } from "@/hooks/use-dashboards";
import { useAuthStore } from "@/stores/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerDashboard() {
  const { data, isLoading } = useCustomerDashboard();
  const user = useAuthStore((s) => s.user);

  const firstName = user?.full_name?.split(" ")[0] ?? "vous";
  const total = Number(data?.total_orders ?? 0);
  const inProgress = Number(data?.in_progress ?? 0);
  const delivered = Number(data?.delivered ?? 0);
  const spend = Number(data?.lifetime_spend ?? 0);

  const aiTip = inProgress > 0
    ? `Vous avez ${inProgress} commande${inProgress > 1 ? "s" : ""} en cours — suivez leur progression en temps réel.`
    : total === 0
      ? "Bienvenue chez Nakoa ! Parcourez le catalogue pour démarrer votre première commande d'impression."
      : `Merci pour votre confiance — ${total} commandes passées sur la plateforme.`;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <DashboardHero
        greeting={`Bonjour ${firstName}`}
        subtitle="Votre espace de pilotage d'impression — devis, commandes et livraisons en un coup d'œil."
        aiTip={aiTip}
        stats={[
          { label: "Commandes", value: total },
          { label: "En cours", value: inProgress, tone: inProgress > 0 ? "warning" : "default" },
          { label: "Livrées", value: delivered, tone: "success" },
          { label: "Dépense", value: formatCurrency(spend, "XOF") },
        ]}
        actions={[
          { href: "/catalog", label: "Catalogue", icon: Boxes },
          { href: "/quotes", label: "Mes devis", icon: FileText },
          { href: "/orders", label: "Mes commandes", icon: Package },
        ]}
      />

      {/* KPI premium */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <KpiCardPremium
              label="Total commandes"
              value={total}
              icon={Package}
              accent="indigo"
              href="/orders"
            />
            <KpiCardPremium
              label="En cours de production"
              value={inProgress}
              icon={Truck}
              accent={inProgress > 0 ? "amber" : "cyan"}
              hint={inProgress > 0 ? "En production" : "Aucune en cours"}
              href="/orders"
            />
            <KpiCardPremium
              label="Livrées"
              value={delivered}
              icon={ShoppingBag}
              accent="emerald"
              href="/orders"
            />
            <KpiCardPremium
              label="Dépense totale"
              value={formatCurrency(spend, "XOF")}
              icon={Wallet}
              accent="pink"
            />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 md:grid-cols-3">
        <QuickActionCard
          href="/catalog"
          label="Nouvelle commande"
          description="Parcourir le catalogue"
          icon={Plus}
          accent="indigo"
        />
        <QuickActionCard
          href="/quotes"
          label="Demander un devis"
          description="Comparer les offres IA"
          icon={FileText}
          accent="cyan"
        />
        <QuickActionCard
          href="/account/payment-methods"
          label="Méthodes de paiement"
          description="Wave, Orange Money, MoMo"
          icon={Wallet}
          accent="emerald"
        />
      </div>

      {/* Dernières commandes */}
      <Card className="surface-premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dernières commandes</CardTitle>
            <p className="text-xs text-muted-foreground">Vos 5 commandes récentes</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/orders">
              Tout voir <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : data?.last_5?.length ? (
            <ul className="divide-y">
              {data.last_5.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10 text-indigo-400">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{o.reference}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <div className="text-right">
                      <p className="font-mono font-semibold">
                        {formatCurrency(Number(o.total_incl_tax), o.currency)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Première commande à portée de clic</p>
                <p className="text-sm text-muted-foreground">
                  Notre IA trouve l&apos;imprimeur idéal en quelques secondes.
                </p>
              </div>
              <Button asChild>
                <Link href="/catalog">
                  <Plus className="mr-2 h-4 w-4" /> Parcourir le catalogue
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
