"use client";

import { formatDistanceToNow } from "date-fns";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type ConversationSummary = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

interface PastConversationsDialogProps {
  conversations: ConversationSummary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (conversationId: string) => void;
}

export const PastConversationsDialog = ({
  conversations,
  open,
  onOpenChange,
  onSelect,
}: PastConversationsDialogProps) => {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Past Conversations"
      description="Search and select a past conversation"
    >
      <CommandInput placeholder="Search conversations..." />
      <CommandList>
        <CommandEmpty>No conversations found.</CommandEmpty>
        <CommandGroup heading="Conversations">
          {conversations.map((conversation) => (
            <CommandItem
              key={conversation.id}
              value={`${conversation.title ?? "Untitled"}-${conversation.id}`}
              onSelect={() => {
                onSelect(conversation.id);
                onOpenChange(false);
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span>{conversation.title ?? "Untitled"}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.updated_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
