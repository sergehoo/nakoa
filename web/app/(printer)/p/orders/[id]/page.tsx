"use client";

import { useParams } from "next/navigation";
import { useOrder, useOrderTransition } from "@/hooks/use-orders";
import { OrderStatusBadge } from "@/components/domain/order-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function PrinterOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);
  const transition = useOrderTransition();

  if (isLoading || !order) return <Skeleton className="h-96" />;

  const canAccept = order.status === "assigned";
  const canStart = order.status === "accepted";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{order.reference}</h1>
          <p className="text-sm text-muted-foreground">
            {order.product_detail?.name} · {order.quantity} pièces
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Total client</CardTitle></CardHeader>
          <CardContent className="font-display text-2xl font-bold">
            {formatCurrency(Number(order.total_incl_tax), order.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Délai promis</CardTitle></CardHeader>
          <CardContent>{order.expected_delivery_at ? formatDateTime(order.expected_delivery_at) : "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Client</CardTitle></CardHeader>
          <CardContent>{order.customer_email}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {canAccept && (
            <Button onClick={() => transition.mutate({ id: order.id, action: "accept" })}>
              Accepter la commande
            </Button>
          )}
          {canStart && (
            <Button onClick={() => transition.mutate({ id: order.id, action: "startProduction" })}>
              Démarrer la production
            </Button>
          )}
          <Button variant="outline" onClick={() => transition.mutate({ id: order.id, action: "cancel", payload: { reason: "indisponible" } })}>
            Refuser
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
