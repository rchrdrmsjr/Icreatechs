"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type ConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: "processing" | "completed" | "cancelled" | "failed";
  created_at: string;
  updated_at?: string;
  model?: string | null;
};

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (silent = false) => {
    if (!conversationId) return;
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load messages");
      }
      setMessages(payload?.messages ?? []);
    } catch (error) {
      if (!silent) {
        const message = error instanceof Error ? error.message : "Failed to load messages";
        toast.error(message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { messages, loading, refresh, setMessages };
};
