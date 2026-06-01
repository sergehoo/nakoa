"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PrinterTeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">Équipe</h1>
        <Button><Plus className="h-4 w-4" /> Inviter</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Membres de l&apos;équipe</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Gérez les opérateurs, contrôleurs qualité et comptables de votre atelier.</p>
        </CardContent>
      </Card>
    </div>
  );
}
