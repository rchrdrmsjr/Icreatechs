import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as Sentry from "@sentry/nextjs";

import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/conversations/[id] - Get a conversation by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/conversations/[id]",
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
            project_id,
            title,
            created_at,
            updated_at,
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

        return NextResponse.json({ conversation });
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

// PATCH /api/conversations/[id] - Update conversation metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "PATCH /api/conversations/[id]",
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

        const body = await request.json();
        const title = typeof body?.title === "string" ? body.title.trim() : null;
        const isArchived =
          typeof body?.isArchived === "boolean" ? body.isArchived : null;

        if (title === null && isArchived === null) {
          return NextResponse.json(
            { error: "No updatable fields provided" },
            { status: 400 },
          );
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

        const updates: Record<string, unknown> = {};
        if (title !== null) updates.title = title;
        if (isArchived !== null) updates.is_archived = isArchived;
        updates.updated_at = new Date().toISOString();

        const { data: updated, error: updateError } = await supabase
          .from("conversations")
          .update(updates)
          .eq("id", id)
          .select("id, title, created_at, updated_at, is_archived")
          .single();

        if (updateError || !updated) {
          Sentry.captureException(updateError);
          return NextResponse.json(
            { error: "Failed to update conversation" },
            { status: 500 },
          );
        }

        return NextResponse.json({ conversation: updated });
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
