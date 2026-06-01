"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/domain/order-status-badge";
import { useOrders } from "@/hooks/use-orders";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PrinterOrdersPage() {
  const { data, isLoading } = useOrders();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Commandes</h1>

      <Card>
        <CardHeader><CardTitle>Toutes vos commandes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <ul className="divide-y">
              {data?.results?.map((o) => (
                <li key={o.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <Link href={`/orders/${o.id}`} className="font-medium hover:underline">{o.reference}</Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(o.created_at)} · {o.quantity} pièces
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(o.total_incl_tax), o.currency)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
