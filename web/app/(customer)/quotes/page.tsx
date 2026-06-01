"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText } from "lucide-react";
import { api, endpoints } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Paginated, QuoteRequest } from "@/lib/api/types";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function QuotesPage() {
  const { data, isLoading } = useQuery<Paginated<QuoteRequest>>({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.quotes.list);
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Mes devis</h1>

      <Card>
        <CardHeader>
          <CardTitle>Demandes en cours</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : data?.results?.length ? (
            <ul className="divide-y">
              {data.results.map((q) => (
                <li key={q.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{q.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.quantity} pièces · {formatDate(q.created_at)}
                    </p>
                  </div>
                  <Badge variant={q.status === "matched" ? "success" : "secondary"}>
                    {q.status === "matched" ? "Offres reçues" : q.status}
                  </Badge>
                  {q.budget_max && (
                    <span className="text-sm text-muted-foreground">
                      ≤ {formatCurrency(Number(q.budget_max), q.currency)}
                    </span>
                  )}
                  <Link href={`/quotes/${q.id}`} className="text-sm text-primary hover:underline">
                    Voir <ArrowRight className="inline h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Aucun devis pour le moment.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
