"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { api } from "@/lib/api/client";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: string;
  sender_email: string;
  body: string;
  created_at: string;
}

export function ChatConversation({ conversationId }: { conversationId: string }) {
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: history, refetch } = useQuery<{ results: Message[] }>({
    queryKey: ["conversation", conversationId, "messages"],
    queryFn: async () => {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages/`);
      return data;
    },
  });

  useWebSocket({
    path: `/ws/chat/${conversationId}/`,
    onMessage: (msg: any) => {
      if (msg?.message) setLiveMessages((prev) => [...prev, msg.message as Message]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [liveMessages, history]);

  const messages = [...(history?.results ?? []), ...liveMessages];

  const send = async () => {
    if (!input.trim()) return;
    await api.post(`/chat/conversations/${conversationId}/messages/`, { body: input });
    setInput("");
    refetch();
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        <div className="space-y-3">
          {messages.map((m) => {
            const isMe = m.sender === user?.id;
            return (
              <div key={m.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    isMe ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary",
                  )}
                >
                  {m.body}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Votre message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button onClick={send}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
