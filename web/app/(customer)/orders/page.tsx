"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/domain/order-status-badge";
import { useOrders } from "@/hooks/use-orders";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerOrdersPage() {
  const { data, isLoading } = useOrders();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Mes commandes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : data?.results?.length ? (
            <ul className="divide-y">
              {data.results.map((o) => (
                <li key={o.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <Link href={`/orders/${o.id}`} className="font-medium hover:underline">{o.reference}</Link>
                    <p className="text-xs text-muted-foreground">{formatDate(o.created_at)} · {o.quantity} pièces</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                  <p className="font-semibold">{formatCurrency(Number(o.total_incl_tax), o.currency)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Aucune commande pour le moment.{" "}
              <Link href="/catalog" className="text-primary hover:underline">Parcourir le catalogue →</Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
