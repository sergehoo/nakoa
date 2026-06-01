"use client";

import { useState } from "react";
import { Sparkles, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS: Record<string, string[]> = {
  customer: [
    "Je veux 500 flyers A5 pour vendredi",
    "Comment fonctionne l'escrow ?",
    "Suivre ma dernière commande",
  ],
  printer: [
    "Comment optimiser mes prix ?",
    "Quelles sont mes commandes du jour ?",
    "Voir mes statistiques de la semaine",
  ],
  admin: [
    "Combien d'imprimeurs en attente KYC ?",
    "Top 5 imprimeurs par CA ce mois",
    "Détecter les commandes à risque",
  ],
};

export function AiAssistantDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const role = user?.primary_role?.startsWith("printer") ? "printer"
    : user?.primary_role?.includes("admin") ? "admin"
    : "customer";

  const ensureConversation = async (): Promise<string> => {
    if (conversationId) return conversationId;
    const { data } = await api.post("/assistant/conversations/", { persona: role });
    setConversationId(data.id);
    return data.id;
  };

  const send = async (text?: string) => {
    const message = text ?? input;
    if (!message.trim()) return;
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: message }]);
    setLoading(true);
    try {
      const id = await ensureConversation();
      const { data } = await api.post(`/assistant/conversations/${id}/send/`, { content: message });
      setMessages((m) => [...m, { id: data.id, role: "assistant", content: data.content }]);
    } catch (e: any) {
      setMessages((m) => [...m, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Désolé, je n'ai pas pu répondre. Réessayez.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Button
        size="lg"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-2xl"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-5 w-5" />
      </Button>

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Assistant PrintHub</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </header>

          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Que puis-je faire pour vous ?</p>
                {SUGGESTIONS[role]?.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left"
                    onClick={() => send(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px]">
                        {m.role === "user" ? "Vs" : "PH"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary",
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> L&apos;assistant réfléchit…
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Posez votre question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={loading}
              />
              <Button onClick={() => send()} disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
