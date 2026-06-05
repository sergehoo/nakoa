"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle, ArrowUpRight, Calendar, Clock, Plus,
  Sparkles, TrendingDown, TrendingUp, type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickAction {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface HeroStat {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}

interface Props {
  greeting: string; // ex: "Bonjour Serge"
  subtitle?: string; // résumé IA de l'activité du jour
  stats?: HeroStat[];
  actions?: QuickAction[];
  aiTip?: string;
}

const TONE_STYLES: Record<NonNullable<HeroStat["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-amber-400",
  danger: "text-rose-400",
  success: "text-emerald-400",
};

export function DashboardHero({
  greeting,
  subtitle,
  stats = [],
  actions = [],
  aiTip,
}: Props) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const dateFmt = now
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    : "";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hero-mesh relative overflow-hidden rounded-2xl border bg-card p-6 lg:p-8"
    >
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 space-y-3">
          {/* Date + Live indicator */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="capitalize">{dateFmt}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-emerald-400">Tout système opérationnel</span>
            </div>
          </div>

          {/* Greeting */}
          <h1 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">
            {greeting}
          </h1>

          {/* AI subtitle */}
          {subtitle && (
            <p className="max-w-2xl text-base text-muted-foreground">{subtitle}</p>
          )}

          {/* Quick actions */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <Button
                    key={a.href}
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-border/80 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5"
                  >
                    <Link href={a.href}>
                      <Icon className="mr-1.5 h-3.5 w-3.5" /> {a.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats inline (à droite) */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-4 lg:gap-6">
            {stats.slice(0, 4).map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                className="min-w-[100px]"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p
                  className={cn(
                    "font-display text-3xl font-bold tabular-nums",
                    TONE_STYLES[s.tone ?? "default"],
                  )}
                >
                  {s.value}
                </p>
                {s.hint && (
                  <p className="text-xs text-muted-foreground">{s.hint}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* AI tip bar (en bas) */}
      {aiTip && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="relative z-10 mt-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="flex-1 text-sm leading-snug">
            <span className="font-semibold text-primary">Nakoa AI :</span>{" "}
            <span className="text-foreground/90">{aiTip}</span>
          </p>
        </motion.div>
      )}
    </motion.section>
  );
}

// ============================================================
// KpiCardPremium — carte KPI animée avec delta + sparkline optionnel
// ============================================================

interface KpiCardPremiumProps {
  label: string;
  value: string | number;
  delta?: number; // en %
  deltaLabel?: string; // ex: "vs hier"
  icon?: LucideIcon;
  accent?: "indigo" | "cyan" | "pink" | "amber" | "emerald";
  hint?: string;
  href?: string;
  loading?: boolean;
}

const ACCENT_GRADIENTS: Record<NonNullable<KpiCardPremiumProps["accent"]>, string> = {
  indigo: "from-indigo-500/20 to-violet-500/5 text-indigo-400",
  cyan: "from-cyan-500/20 to-sky-500/5 text-cyan-400",
  pink: "from-fuchsia-500/20 to-pink-500/5 text-fuchsia-400",
  amber: "from-amber-500/20 to-orange-500/5 text-amber-400",
  emerald: "from-emerald-500/20 to-green-500/5 text-emerald-400",
};

export function KpiCardPremium({
  label, value, delta, deltaLabel = "vs période précédente",
  icon: Icon, accent = "indigo", hint, href, loading,
}: KpiCardPremiumProps) {
  const positive = delta !== undefined && delta >= 0;

  const card = (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="kpi-card group relative p-5"
    >
      {/* Accent gradient overlay */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100",
          ACCENT_GRADIENTS[accent].split(" ")[0],
        )}
      />

      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br",
              ACCENT_GRADIENTS[accent],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-3 h-10 w-32 animate-pulse rounded-md bg-muted" />
      ) : (
        <p className="mt-3 font-display text-4xl font-bold tabular-nums">{value}</p>
      )}

      <div className="mt-2 flex items-center justify-between">
        {delta !== undefined ? (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              positive ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {positive ? "+" : ""}{delta.toFixed(1)}%
            <span className="text-muted-foreground">· {deltaLabel}</span>
          </div>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : (
          <span />
        )}

        {href && (
          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
    </motion.div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

// ============================================================
// QuickActionCard — bloc action avec icon + label
// ============================================================
interface QuickActionCardProps {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  accent?: "indigo" | "cyan" | "pink" | "amber" | "emerald";
}

export function QuickActionCard({
  href, label, description, icon: Icon, accent = "indigo",
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="kpi-card group flex items-center gap-3 p-4"
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br transition-transform group-hover:scale-110",
          ACCENT_GRADIENTS[accent],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{label}</p>
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
    </Link>
  );
}
