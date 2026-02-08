"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type ConversationSummary = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export const useConversations = (projectId: string | null) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/conversations?projectId=${projectId}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load conversations");
      }
      setConversations(payload?.conversations ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load conversations";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { conversations, loading, refresh, setConversations };
};
