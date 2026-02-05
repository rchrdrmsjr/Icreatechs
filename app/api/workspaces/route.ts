import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

// GET /api/workspaces - List all workspaces for authenticated user
export async function GET() {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/workspaces",
    },
    async () => {
      try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Get authenticated user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get workspaces user is a member of
        // First get workspace IDs from workspace_members
        const { data: memberships, error: membershipsError } = await supabase
          .from("workspace_members")
          .select("workspace_id, role")
          .eq("user_id", user.id);

        if (membershipsError) {
          Sentry.captureException(membershipsError);
          return NextResponse.json(
            {
              error: "Failed to fetch workspace memberships",
              details: membershipsError.message,
            },
            { status: 500 },
          );
        }

        // If no memberships, return empty array
        if (!memberships || memberships.length === 0) {
          return NextResponse.json({ workspaces: [] });
        }

        const workspaceIds = memberships.map((m) => m.workspace_id);

        // Get workspace details
        const { data: workspaces, error: workspacesError } = await supabase
          .from("workspaces")
          .select("id, name, slug, description, is_active, created_at")
          .in("id", workspaceIds)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (workspacesError) {
          Sentry.captureException(workspacesError);
          return NextResponse.json(
            {
              error: "Failed to fetch workspaces",
              details: workspacesError.message,
            },
            { status: 500 },
          );
        }

        return NextResponse.json({ workspaces: workspaces || [] });
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
