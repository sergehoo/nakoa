"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/domain/data-table";
import { ShieldCheck, XCircle, Eye } from "lucide-react";

interface KYCRow {
  id: string;
  user: string;
  type: "customer" | "business";
  status: "submitted" | "under_review" | "approved" | "rejected";
  submitted_at: string;
  documents: number;
}

const SAMPLE: KYCRow[] = [
  { id: "1", user: "Cocody Print", type: "business", status: "submitted", submitted_at: "2026-05-12", documents: 6 },
  { id: "2", user: "Aïssata Diallo", type: "customer", status: "under_review", submitted_at: "2026-05-15", documents: 2 },
  { id: "3", user: "Dakar Express", type: "business", status: "submitted", submitted_at: "2026-05-17", documents: 5 },
];

export default function AdminKYCPage() {
  const columns: Column<KYCRow>[] = [
    { header: "Demandeur", cell: (r) => <span className="font-medium">{r.user}</span> },
    { header: "Type", cell: (r) => <Badge variant="secondary">{r.type === "business" ? "KYB Imprimeur" : "KYC Client"}</Badge> },
    { header: "Statut", cell: (r) => (
      <Badge variant={r.status === "submitted" ? "warning" : "default"}>{r.status}</Badge>
    )},
    { header: "Documents", cell: (r) => r.documents },
    { header: "Soumis le", cell: (r) => r.submitted_at },
    { header: "Actions", className: "text-right", cell: () => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
        <Button variant="success" size="sm"><ShieldCheck className="h-4 w-4" /> Approuver</Button>
        <Button variant="destructive" size="sm"><XCircle className="h-4 w-4" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Modération KYC</h1>
        <p className="text-sm text-muted-foreground">SLA cible : 48 heures ouvrées pour traiter une demande.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Demandes en attente</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable data={SAMPLE} columns={columns} rowKey={(r) => r.id} />
        </CardContent>
      </Card>
    </div>
  );
}
