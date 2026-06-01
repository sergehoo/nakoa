"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/domain/kpi-card";
import { Wallet, Receipt, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrinterDashboard } from "@/hooks/use-dashboards";
import { formatCurrency } from "@/lib/utils";

export default function PrinterBillingPage() {
  const { data } = usePrinterDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Facturation & wallet</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Solde wallet" value={formatCurrency(Number(data?.wallet_balance ?? 0))} icon={Wallet} />
        <KpiCard label="CA 30 jours" value={formatCurrency(Number(data?.ca_30d ?? 0))} icon={Receipt} />
        <KpiCard label="Prochain payout" value="Vendredi" icon={ArrowDownToLine} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demander un retrait</CardTitle>
            <Button>Retirer vers Mobile Money</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les retraits sont traités sous 24h ouvrées et envoyés vers le compte Mobile Money configuré.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
