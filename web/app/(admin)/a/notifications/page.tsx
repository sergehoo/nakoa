"use client";

import { useMemo, useState } from "react";
import { Bell, MessageSquare, Lock, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAdminNotificationTypes,
  useUpdateNotificationType,
  type AdminNotificationType,
  type Channel,
} from "@/hooks/use-notification-prefs";

const CHANNELS: { code: Channel; label: string; icon: string }[] = [
  { code: "in_app", label: "In-app", icon: "🔔" },
  { code: "push", label: "Push", icon: "📱" },
  { code: "email", label: "Email", icon: "✉️" },
  { code: "sms", label: "SMS", icon: "💬" },
  { code: "whatsapp", label: "WhatsApp", icon: "🟢" },
];

const CATEGORY_META = {
  transactional: { label: "Transactionnel", icon: Bell, color: "text-pink-500" },
  security: { label: "Sécurité", icon: Lock, color: "text-amber-500" },
  marketing: { label: "Marketing", icon: Sparkles, color: "text-violet-500" },
  system: { label: "Système", icon: MessageSquare, color: "text-muted-foreground" },
};

export default function AdminNotificationsPage() {
  const { data: types, isLoading } = useAdminNotificationTypes();
  const update = useUpdateNotificationType();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, AdminNotificationType[]>();
    for (const t of types ?? []) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return Array.from(map.entries());
  }, [types]);

  const toggleActive = async (t: AdminNotificationType) => {
    setPendingId(t.id);
    try {
      await update.mutateAsync({ id: t.id, is_active: !t.is_active });
      toast.success(t.is_active ? "Type désactivé" : "Type activé");
    } catch {
      toast.error("Échec");
    } finally {
      setPendingId(null);
    }
  };

  const toggleChannel = async (t: AdminNotificationType, ch: Channel) => {
    const has = t.default_channels.includes(ch);
    const next: Channel[] = has
      ? t.default_channels.filter((c) => c !== ch)
      : [...t.default_channels, ch];
    setPendingId(t.id);
    try {
      await update.mutateAsync({ id: t.id, default_channels: next });
    } catch {
      toast.error("Échec");
    } finally {
      setPendingId(null);
    }
  };

  const toggleUserToggleable = async (t: AdminNotificationType) => {
    setPendingId(t.id);
    try {
      await update.mutateAsync({ id: t.id, is_user_toggleable: !t.is_user_toggleable });
    } catch {
      toast.error("Échec");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Notifications — configuration
        </h1>
        <p className="text-sm text-muted-foreground">
          Active/désactive chaque type d'événement et choisis les canaux par défaut.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !types || types.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun type configuré. Lance{" "}
            <code className="rounded bg-secondary px-1.5">manage.py seed_notification_types</code>.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([catKey, items]) => {
            const meta = CATEGORY_META[catKey as keyof typeof CATEGORY_META] ?? CATEGORY_META.transactional;
            const Icon = meta.icon;
            return (
              <div key={catKey} className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon className={`h-4 w-4 ${meta.color}`} /> {meta.label}
                </h2>
                {items.map((t) => (
                  <Card key={t.id} className={t.is_active ? "" : "opacity-60"}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{t.label}</p>
                            <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                              {t.code}
                            </code>
                            <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px]">
                              {t.is_active ? "actif" : "désactivé"}
                            </Badge>
                            {!t.is_user_toggleable && (
                              <Badge variant="outline" className="text-[10px]">forcé</Badge>
                            )}
                          </div>
                          {t.description && (
                            <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserToggleable(t)}
                            disabled={pendingId === t.id}
                          >
                            {t.is_user_toggleable ? "Forcer" : "Libérer"}
                          </Button>
                          <Button
                            variant={t.is_active ? "outline" : "default"}
                            size="sm"
                            onClick={() => toggleActive(t)}
                            disabled={pendingId === t.id}
                          >
                            {t.is_active ? "Désactiver" : "Activer"}
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {CHANNELS.map((ch) => {
                          const enabled = t.default_channels.includes(ch.code);
                          return (
                            <button
                              key={ch.code}
                              type="button"
                              onClick={() => toggleChannel(t, ch.code)}
                              disabled={pendingId === t.id || !t.is_active}
                              className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition ${
                                enabled
                                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                                  : "border-input bg-background text-muted-foreground hover:bg-secondary"
                              } ${(pendingId === t.id || !t.is_active) ? "opacity-50" : ""}`}
                            >
                              <span>{ch.icon}</span>
                              <span>{ch.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
