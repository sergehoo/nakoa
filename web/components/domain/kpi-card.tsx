import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  delta?: { value: string; positive?: boolean };
  className?: string;
}

export function KpiCard({ label, value, icon: Icon, delta, className }: KpiCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="flex items-center gap-4 p-6">
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
          {delta && (
            <p className={cn("text-xs font-medium", delta.positive ? "text-success" : "text-destructive")}>
              {delta.positive ? "↑" : "↓"} {delta.value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
