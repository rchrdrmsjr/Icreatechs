"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  History,
  Loader2,
  Plus,
  Send,
  Square,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PastConversationsDialog } from "@/components/conversations/past-conversations-dialog";

type ConversationSummary = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

type ConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: "processing" | "completed" | "cancelled" | "failed";
  created_at: string;
  updated_at?: string;
  model?: string | null;
};

interface ConversationPanelProps {
  projectId: string;
  aiProvider?: "gemini" | "groq";
  aiModel?: string;
}

const DEFAULT_CONVERSATION_TITLE = "New conversation";

export const ConversationPanel = ({
  projectId,
  aiProvider = "gemini",
  aiModel,
}: ConversationPanelProps) => {
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sending, setSending] = useState(false);
  const [pastConversationsOpen, setPastConversationsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ??
      conversations[0] ??
      null,
    [activeConversationId, conversations],
  );

  const isProcessing = useMemo(
    () => messages.some((message) => message.status === "processing"),
    [messages],
  );

  const lastAssistantMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === "assistant" && message.status === "completed") {
        return message.id;
      }
    }
    return null;
  }, [messages]);

  const loadConversations = useCallback(async () => {
    if (!projectId) return;
    setLoadingConversations(true);
    try {
      const response = await fetch(`/api/conversations?projectId=${projectId}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to load conversations");
      }
      const list = payload?.conversations ?? [];
      setConversations(list);
      if (!activeConversationId && list.length > 0) {
        setActiveConversationId(list[0].id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load conversations";
      toast.error(message);
    } finally {
      setLoadingConversations(false);
    }
  }, [activeConversationId, projectId]);

  const loadMessages = useCallback(
    async (conversationId: string, silent = false) => {
      if (!conversationId) return null;
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load messages");
        }
        const list = payload?.messages ?? [];
        setMessages(list);
        return list as ConversationMessage[];
      } catch (error) {
        if (!silent) {
          const message =
            error instanceof Error ? error.message : "Failed to load messages";
          toast.error(message);
        }
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversation?.id) {
      void loadMessages(activeConversation.id);
    } else {
      setMessages([]);
    }
  }, [activeConversation?.id, loadMessages]);


  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const handleCreateConversation = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title: DEFAULT_CONVERSATION_TITLE }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to create conversation");
      }
      const newConversation = payload?.conversation as ConversationSummary;
      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      return newConversation.id;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create conversation";
      toast.error(message);
      return null;
    }
  }, [projectId]);

  const handleCancel = useCallback(async () => {
    try {
      await fetch("/api/messages/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (activeConversation?.id) {
        await loadMessages(activeConversation.id, true);
      }
    } catch {
      toast.error("Unable to cancel request");
    }
  }, [activeConversation?.id, loadMessages, projectId]);

  const handleSubmit = useCallback(async () => {
    if (isProcessing && !input.trim()) {
      await handleCancel();
      setInput("");
      return;
    }

    const message = input.trim();
    if (!message) return;

    let conversationId: string | null = activeConversation?.id ?? null;

    if (!conversationId) {
      const createdId = await handleCreateConversation();
      if (!createdId) return;
      conversationId = createdId;
    }

    if (!conversationId) return;

    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message,
          aiProvider,
          model: aiModel ?? null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Message failed to send");
      }
      setInput("");
      await loadMessages(conversationId, true);
      await loadConversations();
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Message failed to send";
      toast.error(messageText);
    } finally {
      setSending(false);
    }
  }, [
    activeConversation?.id,
    aiModel,
    aiProvider,
    handleCancel,
    handleCreateConversation,
    input,
    isProcessing,
    loadConversations,
    loadMessages,
  ]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-background">
      <PastConversationsDialog
        conversations={conversations}
        open={pastConversationsOpen}
        onOpenChange={setPastConversationsOpen}
        onSelect={(conversationId) => setActiveConversationId(conversationId)}
      />
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">AI Conversation</span>
          <span className="text-sm font-medium">
            {activeConversation?.title ?? DEFAULT_CONVERSATION_TITLE}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => setPastConversationsOpen(true)}
            title="Conversation history"
          >
            <History className="size-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleCreateConversation}
            title="New conversation"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4" ref={scrollRef}>
        {loadingConversations && !activeConversation ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Start a prompt to begin this conversation.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground",
                  )}
                >
                  {message.status === "processing" || !message.content ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : message.status === "cancelled" ? (
                    <span className="text-muted-foreground italic">
                      Request cancelled
                    </span>
                  ) : message.status === "failed" ? (
                    <span className="text-destructive">
                      Something went wrong. Try again.
                    </span>
                  ) : message.role === "assistant" ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === "assistant" &&
                  message.status === "completed" &&
                  message.id === lastAssistantMessageId && (
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="ml-2"
                      onClick={() => navigator.clipboard.writeText(message.content)}
                      title="Copy response"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about this project..."
            rows={3}
            disabled={sending}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void handleSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {isProcessing
                ? "Assistant is processing..."
                : "Cmd/Ctrl+Enter to send"}
            </span>
            <Button
              type="button"
              size="sm"
              variant={isProcessing && !input.trim() ? "outline" : "default"}
              onClick={handleSubmit}
              disabled={sending || (!input.trim() && !isProcessing)}
            >
              {isProcessing && !input.trim() ? (
                <>
                  <Square className="size-3.5" />
                  Stop
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
