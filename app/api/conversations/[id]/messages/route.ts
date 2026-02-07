import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as Sentry from "@sentry/nextjs";

import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/conversations/[id]/messages - List messages in conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/conversations/[id]/messages",
    },
    async () => {
      try {
        const { id } = await params;
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: conversation, error: conversationError } = await supabase
          .from("conversations")
          .select(
            `
            id,
            projects!inner (
              id,
              workspaces!inner (
                workspace_members!inner (
                  user_id
                )
              )
            )
          `,
          )
          .eq("id", id)
          .eq("projects.workspaces.workspace_members.user_id", user.id)
          .single();

        if (conversationError || !conversation) {
          return NextResponse.json(
            { error: "Conversation not found or access denied" },
            { status: 404 },
          );
        }

        const { data: messages, error: messagesError } = await supabase
          .from("messages")
          .select("id, role, content, status, created_at, updated_at, model")
          .eq("conversation_id", id)
          .order("created_at", { ascending: true });

        if (messagesError) {
          Sentry.captureException(messagesError);
          return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 },
          );
        }

        return NextResponse.json({ messages: messages ?? [] });
      } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
  );
}
