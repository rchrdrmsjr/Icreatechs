import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import * as Sentry from "@sentry/nextjs";
import { cache } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/projects - List all projects for authenticated user
export async function GET() {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/projects",
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

        // Try to get cached projects
        const cacheKey = `projects:user:${user.id}`;
        const cached = await cache.get(cacheKey);

        if (cached) {
          Sentry.logger.info("Projects cache hit", { userId: user.id });
          return NextResponse.json({ projects: cached, cached: true });
        }

        // First, get workspaces user is a member of
        const { data: workspaceMemberships, error: workspaceError } =
          await supabase
            .from("workspace_members")
            .select("workspace_id")
            .eq("user_id", user.id);

        if (workspaceError) {
          Sentry.captureException(workspaceError);
          return NextResponse.json(
            {
              error: "Failed to fetch workspace memberships",
              details: workspaceError.message,
            },
            { status: 500 },
          );
        }

        // If user has no workspace memberships, return empty array
        if (!workspaceMemberships || workspaceMemberships.length === 0) {
          return NextResponse.json({ projects: [] });
        }

        const workspaceIds = workspaceMemberships.map((m) => m.workspace_id);

        // Get projects from user's workspaces
        const { data: projects, error: projectsError } = await supabase
          .from("projects")
          .select("*")
          .in("workspace_id", workspaceIds)
          .order("last_accessed_at", { ascending: false });

        if (projectsError) {
          Sentry.captureException(projectsError);
          return NextResponse.json(
            {
              error: "Failed to fetch projects",
              details: projectsError.message,
            },
            { status: 500 },
          );
        }

        // Cache the projects for 5 minutes
        if (projects && projects.length > 0) {
          await cache.set(cacheKey, projects, 300);
          Sentry.logger.info("Projects cached", {
            userId: user.id,
            count: projects.length,
          });
        }

        return NextResponse.json({ projects: projects || [], cached: false });
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

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/projects",
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
        const {
          name,
          description,
          workspace_id,
          language,
          framework,
          visibility,
        } = body;

        // Validate required fields
        if (!name || !workspace_id) {
          return NextResponse.json(
            { error: "Name and workspace_id are required" },
            { status: 400 },
          );
        }

        // Check if user is a member of the workspace
        const { data: membership, error: membershipError } = await supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", workspace_id)
          .eq("user_id", user.id)
          .single();

        if (membershipError || !membership) {
          return NextResponse.json(
            { error: "You don't have access to this workspace" },
            { status: 403 },
          );
        }

        // Generate slug from name
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        // Create project
        const { data: project, error: createError } = await supabase
          .from("projects")
          .insert({
            workspace_id,
            name,
            slug,
            description: description || null,
            language: language || null,
            framework: framework || null,
            visibility: visibility || "private",
          })
          .select()
          .single();

        if (createError) {
          Sentry.captureException(createError);
          return NextResponse.json(
            { error: "Failed to create project", details: createError.message },
            { status: 500 },
          );
        }

        Sentry.logger.info("Project created", {
          projectId: project.id,
          userId: user.id,
          workspaceId: workspace_id,
        });

        // Invalidate user's projects cache
        const cacheKey = `projects:user:${user.id}`;
        await cache.del(cacheKey);
        Sentry.logger.info("Projects cache invalidated", { userId: user.id });

        return NextResponse.json({ project }, { status: 201 });
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
