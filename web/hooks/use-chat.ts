"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, endpoints } from "@/lib/api/client";

export interface ChatConversation {
  id: string;
  kind: "order" | "quote" | "support" | "general";
  subject: string;
  order: string | null;
  quote_request: string | null;
  last_message_at: string | null;
  is_archived: boolean;
  created_at: string;
  participants_detail?: { id: string; full_name: string; email: string; primary_role: string }[];
  unread_count?: number;
  last_message_preview?: string;
}

export interface ChatMessage {
  id: string;
  conversation: string;
  sender: string;
  sender_detail?: { id: string; full_name: string; email: string; avatar?: string };
  body: string;
  attachments: { url: string; name: string; size: number }[];
  metadata: Record<string, unknown>;
  is_system: boolean;
  edited_at: string | null;
  created_at: string;
}

export function useConversations() {
  return useQuery<{ results: ChatConversation[] } | ChatConversation[]>({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      const { data } = await api.get(endpoints.chat.conversations);
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
    refetchInterval: 30_000, // poll all les 30s
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery<{ results: ChatMessage[] } | ChatMessage[]>({
    queryKey: ["chat-messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data } = await api.get(endpoints.chat.messages(conversationId!));
      return data;
    },
    select: (raw) => (Array.isArray(raw) ? raw : raw.results ?? []),
    refetchInterval: 5_000, // poll régulier en absence de WebSocket
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      const { data } = await api.post<ChatMessage>(
        endpoints.chat.messages(conversationId),
        { body },
      );
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["chat-messages", vars.conversationId] });
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
}
