"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/domain/data-table";
import { useState } from "react";
import { Search } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  primary_role: string;
  country: string;
  is_active: boolean;
  kyc_level: number;
  created_at: string;
}

const SAMPLE: AdminUser[] = [
  { id: "1", email: "aïssata@example.com", full_name: "Aïssata Diallo", primary_role: "customer", country: "CI", is_active: true, kyc_level: 3, created_at: "2026-02-12" },
  { id: "2", email: "atelier@cocodyprint.ci", full_name: "Cocody Print", primary_role: "printer", country: "CI", is_active: true, kyc_level: 4, created_at: "2026-01-04" },
  { id: "3", email: "ahmed@dakarprint.sn", full_name: "Dakar Print Express", primary_role: "printer", country: "SN", is_active: false, kyc_level: 2, created_at: "2026-03-22" },
];

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const data = SAMPLE.filter((u) =>
    `${u.full_name} ${u.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  const columns: Column<AdminUser>[] = [
    { header: "Utilisateur", cell: (u) => (
      <div>
        <p className="font-medium">{u.full_name}</p>
        <p className="text-xs text-muted-foreground">{u.email}</p>
      </div>
    )},
    { header: "Rôle", cell: (u) => <Badge variant="secondary">{u.primary_role}</Badge> },
    { header: "Pays", cell: (u) => u.country },
    { header: "KYC", cell: (u) => <Badge variant={u.kyc_level >= 3 ? "success" : "warning"}>Niveau {u.kyc_level}</Badge> },
    { header: "Statut", cell: (u) => <Badge variant={u.is_active ? "success" : "destructive"}>{u.is_active ? "Actif" : "Inactif"}</Badge> },
    { header: "", cell: () => <Button variant="ghost" size="sm">Voir</Button>, className: "text-right" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Utilisateurs</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Annuaire</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable data={data} columns={columns} rowKey={(u) => u.id} />
        </CardContent>
      </Card>
    </div>
  );
}
