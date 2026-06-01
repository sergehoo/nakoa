"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8001";

interface UseWebSocketOptions {
  path: string;
  onMessage?: (data: unknown) => void;
  enabled?: boolean;
}

export function useWebSocket({ path, onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const access = useAuthStore((s) => s.access);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const url = `${WS_BASE}${path}${access ? `?token=${access}` : ""}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessage?.(data);
      } catch {
        onMessage?.(e.data);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [path, access, enabled, onMessage]);

  return { send: (msg: unknown) => wsRef.current?.send(JSON.stringify(msg)) };
}
