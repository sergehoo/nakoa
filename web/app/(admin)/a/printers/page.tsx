"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/domain/data-table";

interface AdminPrinter {
  id: string;
  trade_name: string;
  country: string;
  city: string;
  status: string;
  quality_score: number;
  on_time_rate: number;
  monthly_orders: number;
}

const SAMPLE: AdminPrinter[] = [
  { id: "1", trade_name: "Cocody Print", country: "CI", city: "Abidjan", status: "active", quality_score: 96, on_time_rate: 94, monthly_orders: 48 },
  { id: "2", trade_name: "Atelier Treichville", country: "CI", city: "Abidjan", status: "active", quality_score: 88, on_time_rate: 91, monthly_orders: 36 },
  { id: "3", trade_name: "Dakar Print Express", country: "SN", city: "Dakar", status: "probation", quality_score: 72, on_time_rate: 78, monthly_orders: 12 },
];

export default function AdminPrintersPage() {
  const columns: Column<AdminPrinter>[] = [
    { header: "Atelier", cell: (p) => (
      <div>
        <p className="font-medium">{p.trade_name}</p>
        <p className="text-xs text-muted-foreground">{p.city}, {p.country}</p>
      </div>
    )},
    { header: "Statut", cell: (p) => (
      <Badge variant={p.status === "active" ? "success" : p.status === "probation" ? "warning" : "destructive"}>
        {p.status}
      </Badge>
    )},
    { header: "Score qualité", cell: (p) => `${p.quality_score}/100` },
    { header: "Délais", cell: (p) => `${p.on_time_rate}%` },
    { header: "Commandes 30j", cell: (p) => p.monthly_orders },
    { header: "", cell: () => <Button variant="ghost" size="sm">Voir</Button>, className: "text-right" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Imprimeurs</h1>

      <Card>
        <CardHeader><CardTitle>Atelier partenaires</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable data={SAMPLE} columns={columns} rowKey={(p) => p.id} />
        </CardContent>
      </Card>
    </div>
  );
}
