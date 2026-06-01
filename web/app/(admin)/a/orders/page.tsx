"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/domain/order-status-badge";
import { DataTable, type Column } from "@/components/domain/data-table";
import { useOrders } from "@/hooks/use-orders";
import type { Order } from "@/lib/api/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminOrdersPage() {
  const { data, isLoading } = useOrders();

  const columns: Column<Order>[] = [
    { header: "Référence", cell: (o) => <span className="font-medium">{o.reference}</span> },
    { header: "Client", cell: (o) => o.customer_email ?? "—" },
    { header: "Imprimeur", cell: (o) => o.printer_detail?.trade_name ?? "—" },
    { header: "Quantité", cell: (o) => o.quantity },
    { header: "Total", cell: (o) => formatCurrency(Number(o.total_incl_tax), o.currency) },
    { header: "Statut", cell: (o) => <OrderStatusBadge status={o.status} /> },
    { header: "Créée le", cell: (o) => formatDate(o.created_at) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Commandes</h1>

      <Card>
        <CardHeader><CardTitle>Toutes les commandes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <DataTable data={data?.results ?? []} columns={columns} rowKey={(o) => o.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
