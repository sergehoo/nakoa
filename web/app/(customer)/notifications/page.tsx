"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle, Bell, CheckCircle2, ChevronLeft, ChevronRight, Clock,
  FileText, Filter, Inbox, Loader2, MessageSquare, Package, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead,
  type Notification,
} from "@/hooks/use-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<string, typeof Bell> = {
  order: Package,
  order_assigned: Package,
  new_offer: Sparkles,
  message: MessageSquare,
  chat: MessageSquare,
  document: FileText,
  alert: AlertCircle,
  opportunity: Sparkles,
  payment: CheckCircle2,
};

const KIND_LABELS: Record<string, string> = {
  order: "Commande",
  order_assigned: "Attribution",
  new_offer: "Nouvelle offre",
  message: "Message",
  chat: "Chat",
  document: "Document",
  alert: "Alerte",
  opportunity: "Opportunité",
  payment: "Paiement",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

function NotificationRow({ n }: { n: Notification }) {
  const markRead = useMarkNotificationRead();
  const Icon = KIND_ICONS[n.kind] ?? Bell;

  const handleClick = () => {
    if (!n.is_read) markRead.mutate(n.id);
  };

  const content = (
    <div
      onClick={handleClick}
      className={cn(
        "flex cursor-pointer items-start gap-3 border-b p-4 transition-colors last:border-b-0 hover:bg-secondary/40",
        !n.is_read && "bg-primary/5",
      )}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        !n.is_read ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className={cn("text-sm", !n.is_read && "font-semibold")}>{n.subject}</p>
          <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[9px]">
            {KIND_LABELS[n.kind] ?? n.kind}
          </Badge>
        </div>
        {n.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
        )}
        <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" /> {timeAgo(n.created_at)}
        </p>
      </div>

      {!n.is_read && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  );

  return n.link ? (
    <Link href={n.link} className="block">{content}</Link>
  ) : content;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const markAll = useMarkAllNotificationsRead();

  const { data, isLoading } = useNotifications({
    page,
    is_read: filter === "unread" ? false : undefined,
  });

  const total = data?.count ?? 0;
  const items = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil(total / 25));
  const unreadCount = items.filter((n) => !n.is_read).length;

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success("Toutes les notifications marquées comme lues");
    } catch {
      toast.error("Échec");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Toute votre activité Nakoa en un endroit.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAll} disabled={markAll.isPending}>
            {markAll.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckCircle2 className="mr-2 h-4 w-4" /> Tout marquer lu
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => { setFilter(v as never); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">Toutes ({total})</TabsTrigger>
          <TabsTrigger value="unread">
            Non lues {unreadCount > 0 && <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{unreadCount}</span>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="surface-premium">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/15 to-amber-500/10">
                <Inbox className="h-7 w-7 text-orange-400" />
              </div>
              <div>
                <p className="font-semibold">
                  {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vous êtes à jour. Reposez-vous bien.
                </p>
              </div>
            </div>
          ) : (
            <div>{items.map((n) => <NotificationRow key={n.id} n={n} />)}</div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Précédent
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Suivant <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
