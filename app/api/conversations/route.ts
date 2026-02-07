import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as Sentry from "@sentry/nextjs";

import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const DEFAULT_CONVERSATION_TITLE = "New conversation";

// GET /api/conversations?projectId=... - List conversations for a project
export async function GET(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/conversations",
    },
    async () => {
      try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
          return NextResponse.json(
            { error: "projectId is required" },
            { status: 400 },
          );
        }

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select(
            `
            id,
            workspaces!inner (
              workspace_members!inner (
                user_id
              )
            )
          `,
          )
          .eq("id", projectId)
          .eq("workspaces.workspace_members.user_id", user.id)
          .single();

        if (projectError || !project) {
          return NextResponse.json(
            { error: "Project not found or access denied" },
            { status: 404 },
          );
        }

        const { data: conversations, error: conversationsError } = await supabase
          .from("conversations")
          .select("id, title, created_at, updated_at")
          .eq("project_id", projectId)
          .order("updated_at", { ascending: false });

        if (conversationsError) {
          Sentry.captureException(conversationsError);
          return NextResponse.json(
            {
              error: "Failed to fetch conversations",
              details: conversationsError.message,
            },
            { status: 500 },
          );
        }

        return NextResponse.json({ conversations: conversations ?? [] });
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

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/conversations",
    },
    async () => {
      try {
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
        const projectId = body?.projectId;
        const title = typeof body?.title === "string" ? body.title.trim() : "";

        if (!projectId) {
          return NextResponse.json(
            { error: "projectId is required" },
            { status: 400 },
          );
        }

        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select(
            `
            id,
            workspaces!inner (
              workspace_members!inner (
                user_id
              )
            )
          `,
          )
          .eq("id", projectId)
          .eq("workspaces.workspace_members.user_id", user.id)
          .single();

        if (projectError || !project) {
          return NextResponse.json(
            { error: "Project not found or access denied" },
            { status: 404 },
          );
        }

        const { data: conversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            project_id: projectId,
            user_id: user.id,
            title: title || DEFAULT_CONVERSATION_TITLE,
          })
          .select("id, title, created_at, updated_at")
          .single();

        if (createError || !conversation) {
          Sentry.captureException(createError);
          return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500 },
          );
        }

        return NextResponse.json({ conversation }, { status: 201 });
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
