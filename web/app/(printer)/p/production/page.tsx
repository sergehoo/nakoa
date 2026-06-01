"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, AlertTriangle, Play, Pause, Check, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { api, endpoints } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Paginated, ProductionJob } from "@/lib/api/types";
import { relativeTime } from "@/lib/utils";

const COLUMNS: { status: string; label: string; tone: string }[] = [
  { status: "queued", label: "À démarrer", tone: "bg-secondary" },
  { status: "in_progress", label: "En cours", tone: "bg-primary/10" },
  { status: "on_hold", label: "En pause", tone: "bg-warning/10" },
  { status: "blocked", label: "Bloqué", tone: "bg-destructive/10" },
  { status: "done", label: "Terminé", tone: "bg-success/10" },
];

export default function ProductionKanban() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Paginated<ProductionJob>>({
    queryKey: ["production-jobs"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.production.jobs);
      return data;
    },
    refetchInterval: 15_000,
  });

  const transition = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const { data } = await api.post(`${endpoints.production.jobs}${id}/${action}/`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production-jobs"] });
      toast.success("Statut mis à jour");
    },
    onError: () => toast.error("Transition refusée"),
  });

  const groupedJobs: Record<string, ProductionJob[]> = COLUMNS.reduce(
    (acc, c) => ({ ...acc, [c.status]: [] }),
    {},
  );
  data?.results?.forEach((j) => groupedJobs[j.status]?.push(j));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Production</h1>
          <p className="text-sm text-muted-foreground">Vue Kanban des ordres de fabrication.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : (
        <div className="grid gap-4 overflow-x-auto md:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.status} className={`flex flex-col rounded-xl border ${col.tone}`}>
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <Badge variant="secondary">{groupedJobs[col.status]?.length ?? 0}</Badge>
              </div>
              <div className="flex-1 space-y-2 p-2">
                {groupedJobs[col.status]?.map((job) => (
                  <Card key={job.id} className="cursor-pointer transition-shadow hover:shadow">
                    <CardContent className="space-y-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{job.order_reference}</p>
                          <p className="text-xs text-muted-foreground">{job.reference}</p>
                        </div>
                        <Badge variant={job.priority <= 3 ? "destructive" : "default"} className="text-[10px]">
                          P{job.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {job.started_at ? relativeTime(job.started_at) : "Non démarré"}
                      </div>
                      <div className="flex gap-1">
                        {job.status === "queued" && (
                          <Button size="sm" variant="outline" className="h-7 flex-1" onClick={() => transition.mutate({ id: job.id, action: "start" })}>
                            <Play className="h-3 w-3" /> Démarrer
                          </Button>
                        )}
                        {job.status === "in_progress" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 flex-1" onClick={() => transition.mutate({ id: job.id, action: "pause" })}>
                              <Pause className="h-3 w-3" />
                            </Button>
                            <Button size="sm" className="h-7 flex-1" onClick={() => transition.mutate({ id: job.id, action: "finish" })}>
                              <Check className="h-3 w-3" /> Terminer
                            </Button>
                          </>
                        )}
                        {job.status === "on_hold" && (
                          <Button size="sm" variant="outline" className="h-7 flex-1" onClick={() => transition.mutate({ id: job.id, action: "resume" })}>
                            <Play className="h-3 w-3" /> Reprendre
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!groupedJobs[col.status]?.length && (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                    <ListChecks className="mx-auto mb-1 h-5 w-5 opacity-50" />
                    Aucun job
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
