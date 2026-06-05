"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle, Bell, CheckCircle2, Clock, FileText, MessageSquare,
  Package, Sparkles, X,
} from "lucide-react";

import { api, endpoints } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  kind: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

const ICON_MAP: Record<string, typeof Bell> = {
  order: Package,
  message: MessageSquare,
  document: FileText,
  alert: AlertCircle,
  success: CheckCircle2,
  ai: Sparkles,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function NotificationBell() {
  const { data, refetch } = useQuery<{ results?: Notification[] } | Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.notifications.list, {
        params: { page_size: 8, ordering: "-created_at" },
      });
      return data;
    },
    refetchInterval: 60_000, // toutes les minutes
    retry: false,
  });

  const items = Array.isArray(data) ? data : data?.results ?? [];
  const unreadCount = items.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await api.post(endpoints.notifications.readAll);
      refetch();
    } catch {}
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full notif-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost" size="sm"
              onClick={markAllRead}
              className="h-7 px-2 text-xs"
            >
              Tout marquer lu
            </Button>
          )}
        </div>

        <div className="max-h-[440px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Tout est calme</p>
              <p className="text-xs text-muted-foreground">
                Vous serez notifié des évènements importants.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((n) => {
                const Icon = ICON_MAP[n.kind] ?? Bell;
                const body = (
                  <div className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/50",
                    !n.is_read && "bg-primary/5",
                  )}>
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      !n.is_read ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "truncate text-sm",
                        !n.is_read && "font-medium",
                      )}>
                        {n.subject}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" /> {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );

                return n.link ? (
                  <Link key={n.id} href={n.link} className="block">{body}</Link>
                ) : (
                  <div key={n.id}>{body}</div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2">
          <Link
            href="/notifications"
            className="block text-center text-xs font-medium text-primary hover:underline"
          >
            Voir toutes les notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
