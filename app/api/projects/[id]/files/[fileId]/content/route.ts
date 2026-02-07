import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

const createStorageClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
};

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
          const storageClient = createStorageClient();
          const { data, error: downloadError } = await storageClient.storage
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

// PUT /api/projects/[id]/files/[fileId]/content - Save file content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "PUT /api/projects/[id]/files/[fileId]/content",
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

        const body = await request.json();
        const { content } = body;

        if (typeof content !== "string") {
          return NextResponse.json(
            { error: "content must be a string" },
            { status: 400 },
          );
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

        const { data: file, error: fileError } = await supabase
          .from("files")
          .select("id, project_id, type, path, storage_path")
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
            { error: "Cannot save content for folders" },
            { status: 400 },
          );
        }

        const storageClient = createStorageClient();
        const sizeBytes = new TextEncoder().encode(content).length;
        const storageFilePath = file.storage_path ?? `${id}/${file.path}`;
        const fileBlob = new Blob([content], { type: "text/plain" });

        const { error: uploadError } = await storageClient.storage
          .from("project-files")
          .upload(storageFilePath, fileBlob, {
            contentType: "text/plain",
            upsert: true,
          });

        if (uploadError) {
          Sentry.captureException(uploadError);
          return NextResponse.json(
            {
              error: "Failed to upload file to storage",
              details: uploadError.message,
            },
            { status: 500 },
          );
        }

        const { error: updateError } = await supabase
          .from("files")
          .update({
            content: null,
            size_bytes: sizeBytes,
            storage_path: storageFilePath,
            updated_by: user.id,
          })
          .eq("id", fileId);

        if (updateError) {
          Sentry.captureException(updateError);
          return NextResponse.json(
            { error: "Failed to save file" },
            { status: 500 },
          );
        }

        return NextResponse.json({ saved: true });
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
