import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/workspaces",
    },
    async () => {
      try {
        const supabase = createClient(cookies());

        // Get authenticated user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, description } = body;

        // Validate required fields
        if (!name) {
          return NextResponse.json(
            { error: "Name is required" },
            { status: 400 },
          );
        }

        // Generate slug from name
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        // Use database function to create workspace and member atomically
        // This bypasses RLS recursion issues
        const { data: result, error: createError } = await supabase.rpc(
          "create_workspace_with_member",
          {
            workspace_name: name,
            workspace_slug: slug,
            workspace_description: description || null,
            user_id: user.id,
          },
        );

        if (createError) {
          Sentry.captureException(createError);
          return NextResponse.json(
            {
              error: "Failed to create workspace",
              details: createError.message,
            },
            { status: 500 },
          );
        }

        const workspace = result as any;

        Sentry.logger.info("Workspace created", {
          workspaceId: workspace.id,
          userId: user.id,
        });

        return NextResponse.json({ workspace }, { status: 201 });
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
