"use client";

import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/api/types";

const LABEL: Record<OrderStatus, string> = {
  draft: "Brouillon",
  quote_pending: "Devis en attente",
  quoted: "Devis disponible",
  bat_uploaded: "BAT déposé",
  bat_validated: "BAT validé",
  payment_pending: "Paiement en attente",
  paid: "Payée",
  assigned: "Attribuée",
  accepted: "Acceptée",
  in_production: "En production",
  quality_check: "Contrôle qualité",
  ready_for_pickup: "Prête",
  in_delivery: "En livraison",
  delivered: "Livrée",
  completed: "Clôturée",
  cancelled: "Annulée",
  disputed: "En litige",
  refunded: "Remboursée",
};

const VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive" | "success" | "warning"> = {
  draft: "secondary",
  quote_pending: "warning",
  quoted: "default",
  bat_uploaded: "secondary",
  bat_validated: "default",
  payment_pending: "warning",
  paid: "success",
  assigned: "default",
  accepted: "default",
  in_production: "default",
  quality_check: "warning",
  ready_for_pickup: "default",
  in_delivery: "default",
  delivered: "success",
  completed: "success",
  cancelled: "destructive",
  disputed: "destructive",
  refunded: "secondary",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
