"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Inbox, Loader2, MessageSquare, Send, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  useConversations, useMessages, useSendMessage,
  type ChatConversation, type ChatMessage,
} from "@/hooks/use-chat";
import { useAuthStore } from "@/stores/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, initials } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function ConversationItem({
  conv, active, onClick,
}: {
  conv: ChatConversation;
  active: boolean;
  onClick: () => void;
}) {
  const otherParticipant = conv.participants_detail?.find(
    (p) => p.primary_role !== "customer" && p.primary_role !== "customer_corporate",
  ) ?? conv.participants_detail?.[0];

  const displayName = otherParticipant?.full_name || otherParticipant?.email || conv.subject || "Conversation";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border-b p-4 text-left transition-colors hover:bg-secondary/40",
        active && "bg-orange-500/10 border-l-2 border-l-orange-500",
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-rose-500 text-xs text-white">
          {initials(displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("truncate text-sm", (conv.unread_count ?? 0) > 0 && "font-semibold")}>
            {displayName}
          </p>
          {conv.last_message_at && (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {timeAgo(conv.last_message_at)}
            </span>
          )}
        </div>
        {conv.subject && <p className="truncate text-xs text-muted-foreground">{conv.subject}</p>}
        {conv.last_message_preview && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {conv.last_message_preview}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary" className="h-4 px-1 text-[9px]">
            {conv.kind === "order" ? "Commande" : conv.kind === "quote" ? "Devis" : conv.kind}
          </Badge>
          {(conv.unread_count ?? 0) > 0 && (
            <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
              {conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function MessageBubble({ message, isMine }: { message: ChatMessage; isMine: boolean }) {
  if (message.is_system) {
    return (
      <div className="mx-auto rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">
        {message.body}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", isMine && "flex-row-reverse")}>
      {!isMine && (
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-[10px]">
            {initials(message.sender_detail?.full_name ?? "?")}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-[75%]", isMine && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm",
            isMine
              ? "bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-br-sm"
              : "bg-secondary rounded-bl-sm",
          )}
        >
          {message.body}
        </div>
        <p className={cn("mt-0.5 text-[10px] text-muted-foreground", isMine && "text-right")}>
          {new Date(message.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function ConversationView({ conversation }: { conversation: ChatConversation }) {
  const user = useAuthStore((s) => s.user);
  const { data: messages, isLoading } = useMessages(conversation.id);
  const list = (messages as ChatMessage[] | undefined) ?? [];
  const [body, setBody] = useState("");
  const send = useSendMessage();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll auto en bas à chaque nouveau message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [list.length]);

  const handleSend = async () => {
    if (!body.trim()) return;
    try {
      await send.mutateAsync({ conversationId: conversation.id, body: body.trim() });
      setBody("");
    } catch {
      toast.error("Échec de l'envoi");
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-[600px] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <Avatar>
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-rose-500 text-white">
            {initials(conversation.subject || "C")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{conversation.subject || "Conversation"}</p>
          <p className="text-xs text-muted-foreground capitalize">{conversation.kind}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-2/3 ml-auto" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <Sparkles className="mx-auto h-10 w-10 text-orange-400" />
              <p className="mt-3 font-semibold">Conversation commencée</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Envoyez le premier message pour démarrer.
              </p>
            </div>
          </div>
        ) : (
          list.map((m) => (
            <MessageBubble key={m.id} message={m} isMine={m.sender === user?.id} />
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Tapez votre message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKey}
            disabled={send.isPending}
          />
          <Button onClick={handleSend} disabled={!body.trim() || send.isPending}>
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { data: convs, isLoading } = useConversations();
  const list = (convs as ChatConversation[] | undefined) ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = list.find((c) => c.id === activeId) ?? list[0];

  // Auto-select première conversation au chargement
  useEffect(() => {
    if (!activeId && list.length > 0) setActiveId(list[0].id);
  }, [list, activeId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Échangez avec vos imprimeurs sur chaque commande et devis.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-[600px]" />
      ) : list.length === 0 ? (
        <Card className="surface-premium">
          <CardContent className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/15 to-amber-500/10">
              <MessageSquare className="h-7 w-7 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold">Aucune conversation</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Les conversations se créent automatiquement avec votre imprimeur dès que vous passez
                votre première commande ou demande de devis.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="surface-premium overflow-hidden">
          <div className="grid h-[600px] md:grid-cols-[320px_1fr]">
            {/* Liste conversations */}
            <div className="overflow-y-auto border-r">
              {list.map((c) => (
                <ConversationItem
                  key={c.id}
                  conv={c}
                  active={active?.id === c.id}
                  onClick={() => setActiveId(c.id)}
                />
              ))}
            </div>

            {/* Vue conversation */}
            {active ? (
              <ConversationView conversation={active} />
            ) : (
              <div className="flex items-center justify-center text-center">
                <div>
                  <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 font-semibold">Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
