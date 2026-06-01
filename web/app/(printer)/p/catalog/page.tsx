"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PrinterCatalogPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Catalogue & prix</h1>
          <p className="text-sm text-muted-foreground">Définissez les produits que vous imprimez et vos grilles tarifaires.</p>
        </div>
        <Button><Plus className="h-4 w-4" /> Nouveau produit</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Grilles tarifaires actives</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune grille configurée. Créez-en une pour commencer à recevoir des demandes de devis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
