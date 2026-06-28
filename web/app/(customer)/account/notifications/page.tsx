"use client";

import { useMemo } from "react";
import { Bell, MessageSquare, Lock, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PushNotificationCard } from "@/components/notifications/push-notification-card";
import {
  useMyNotificationPreferences,
  useUpdateMyPreference,
  type Channel,
  type NotificationTypePref,
} from "@/hooks/use-notification-prefs";

const CHANNEL_META: Record<Channel, { label: string; icon: string }> = {
  in_app: { label: "Dans l'app", icon: "🔔" },
  push: { label: "Push", icon: "📱" },
  email: { label: "Email", icon: "✉️" },
  sms: { label: "SMS", icon: "💬" },
  whatsapp: { label: "WhatsApp", icon: "🟢" },
};

const CATEGORY_META = {
  transactional: { label: "Transactionnel", icon: Bell, color: "text-pink-500" },
  security: { label: "Sécurité", icon: Lock, color: "text-amber-500" },
  marketing: { label: "Marketing", icon: Sparkles, color: "text-violet-500" },
  system: { label: "Système", icon: MessageSquare, color: "text-muted-foreground" },
};

export default function NotificationsSettingsPage() {
  const { data: prefs, isLoading } = useMyNotificationPreferences();
  const update = useUpdateMyPreference();

  const groups = useMemo(() => {
    const map = new Map<string, NotificationTypePref[]>();
    for (const p of prefs ?? []) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return Array.from(map.entries());
  }, [prefs]);

  const toggleChannel = async (pref: NotificationTypePref, channel: Channel) => {
    if (!pref.is_user_toggleable) {
      toast.message("Notification non modifiable", {
        description: "Ce type est forcé pour des raisons de sécurité.",
      });
      return;
    }
    const enabled = pref.channels.includes(channel);
    const next: Channel[] = enabled
      ? pref.channels.filter((c) => c !== channel)
      : [...pref.channels, channel];
    try {
      await update.mutateAsync({ type_code: pref.code, channels: next });
    } catch {
      toast.error("Échec de la mise à jour");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Notifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Choisis comment Nakoa te tient au courant pour chaque type d'événement.
        </p>
      </div>

      <PushNotificationCard />

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !prefs || prefs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun type de notification configuré côté serveur.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([categoryKey, items]) => {
            const meta = CATEGORY_META[categoryKey as keyof typeof CATEGORY_META] ?? CATEGORY_META.transactional;
            const Icon = meta.icon;
            return (
              <Card key={categoryKey}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                    {meta.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y">
                  {items.map((pref) => (
                    <div key={pref.code} className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{pref.label}</p>
                          {!pref.is_user_toggleable && (
                            <Badge variant="outline" className="text-[10px]">forcé</Badge>
                          )}
                          {pref.is_overridden && (
                            <Badge variant="secondary" className="text-[10px]">personnalisé</Badge>
                          )}
                        </div>
                        {pref.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{pref.description}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(CHANNEL_META) as Channel[]).map((ch) => {
                          const enabled = pref.channels.includes(ch);
                          const disabled = !pref.is_user_toggleable;
                          return (
                            <button
                              key={ch}
                              type="button"
                              onClick={() => !disabled && toggleChannel(pref, ch)}
                              disabled={disabled || update.isPending}
                              className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition ${
                                enabled
                                  ? "border-pink-500/50 bg-pink-500/10 text-pink-600"
                                  : "border-input bg-background text-muted-foreground hover:bg-secondary"
                              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                            >
                              <span>{CHANNEL_META[ch].icon}</span>
                              <span>{CHANNEL_META[ch].label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
