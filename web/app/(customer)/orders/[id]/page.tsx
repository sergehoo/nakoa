"use client";

import { useParams } from "next/navigation";
import { Check, Circle, Clock, Loader2, Package, Truck } from "lucide-react";
import { useOrder } from "@/hooks/use-orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/domain/order-status-badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderStatus } from "@/lib/api/types";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "paid", label: "Paiement" },
  { status: "accepted", label: "Acceptée" },
  { status: "in_production", label: "Production" },
  { status: "quality_check", label: "Contrôle qualité" },
  { status: "in_delivery", label: "Livraison" },
  { status: "delivered", label: "Livrée" },
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: order, isLoading } = useOrder(id);

  useWebSocket({
    path: `/ws/orders/${id}/`,
    onMessage: () => qc.invalidateQueries({ queryKey: ["order", id] }),
  });

  if (isLoading || !order) {
    return <Skeleton className="h-96" />;
  }

  const currentIdx = STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{order.reference}</h1>
          <p className="text-sm text-muted-foreground">
            Créée le {formatDateTime(order.created_at)} · {order.product_detail?.name} · {order.quantity} pièces
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suivi de production</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-3 gap-4 md:grid-cols-6">
            {STEPS.map((step, i) => {
              const done = currentIdx >= i;
              const active = currentIdx === i;
              return (
                <li key={step.status} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      done && "border-primary bg-primary text-primary-foreground",
                      active && "animate-pulse",
                      !done && "border-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                  </div>
                  <p className={cn("mt-2 text-xs font-medium", !done && "text-muted-foreground")}>{step.label}</p>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Total payé</CardTitle></CardHeader>
          <CardContent className="font-display text-2xl font-bold">
            {formatCurrency(Number(order.total_incl_tax), order.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Livraison estimée</CardTitle></CardHeader>
          <CardContent className="font-medium">
            {order.expected_delivery_at ? formatDateTime(order.expected_delivery_at) : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Imprimeur</CardTitle></CardHeader>
          <CardContent>
            {order.printer_detail ? (
              <>
                <p className="font-medium">{order.printer_detail.trade_name}</p>
                <p className="text-xs text-muted-foreground">{order.printer_detail.city}</p>
              </>
            ) : (
              <span className="text-muted-foreground">En cours d&apos;attribution…</span>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adresse de livraison</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{order.delivery_address.address}</p>
          <p>{order.delivery_address.city}, {order.delivery_address.country}</p>
        </CardContent>
      </Card>
    </div>
  );
}
