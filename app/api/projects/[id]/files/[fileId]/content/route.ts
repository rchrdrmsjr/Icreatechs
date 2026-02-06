import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

// GET /api/projects/[id]/files/[fileId]/content - Get file content
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/projects/[id]/files/[fileId]/content",
    },
    async () => {
      try {
        const { id, fileId } = await params;
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify project access
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
          .eq("id", id)
          .eq("workspaces.workspace_members.user_id", user.id)
          .single();

        if (projectError || !project) {
          return NextResponse.json(
            { error: "Project not found or access denied" },
            { status: 404 },
          );
        }

        // Get file record
        const { data: file, error: fileError } = await supabase
          .from("files")
          .select("id, project_id, type, content, storage_path")
          .eq("id", fileId)
          .eq("project_id", id)
          .eq("is_deleted", false)
          .single();

        if (fileError || !file) {
          return NextResponse.json(
            { error: "File not found" },
            { status: 404 },
          );
        }

        if (file.type !== "file") {
          return NextResponse.json(
            { error: "Cannot retrieve content for folders" },
            { status: 400 },
          );
        }

        // If content is in database, return it
        if (file.content) {
          return NextResponse.json({ content: file.content });
        }

        // Otherwise, fetch from storage
        if (file.storage_path) {
          const { data, error: downloadError } = await supabase.storage
            .from("project-files")
            .download(file.storage_path);

          if (downloadError) {
            Sentry.captureException(downloadError);
            return NextResponse.json(
              { error: "Failed to download file from storage" },
              { status: 500 },
            );
          }

          const content = await data.text();
          return NextResponse.json({ content });
        }

        // No content available
        return NextResponse.json({ content: "" });
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
