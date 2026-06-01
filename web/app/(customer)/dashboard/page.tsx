"use client";

import Link from "next/link";
import { ArrowRight, Package, Plus, ShoppingBag, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/domain/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/domain/order-status-badge";
import { useCustomerDashboard } from "@/hooks/use-dashboards";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerDashboard() {
  const { data, isLoading } = useCustomerDashboard();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Bonjour 👋</h1>
          <p className="text-sm text-muted-foreground">Voici un aperçu de votre activité PrintHub.</p>
        </div>
        <Button asChild>
          <Link href="/catalog">
            <Plus className="h-4 w-4" /> Nouvelle commande
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard label="Commandes" value={data?.total_orders ?? 0} icon={Package} />
            <KpiCard label="En cours" value={data?.in_progress ?? 0} icon={Truck} />
            <KpiCard label="Livrées" value={data?.delivered ?? 0} icon={ShoppingBag} />
            <KpiCard label="Dépense totale" value={formatCurrency(Number(data?.lifetime_spend ?? 0))} icon={Wallet} />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dernières commandes</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/orders">Tout voir <ArrowRight className="h-4 w-4" /></Link>
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
                <li key={o.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{o.reference}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(o.total_incl_tax), o.currency)}</p>
                    <Link href={`/orders/${o.id}`} className="text-xs text-primary hover:underline">
                      Voir →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Vous n&apos;avez pas encore de commande.{" "}
              <Link href="/catalog" className="text-primary hover:underline">Parcourir le catalogue →</Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
