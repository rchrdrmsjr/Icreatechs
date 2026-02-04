"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  language: string | null;
  framework: string | null;
  visibility: string;
  repository_url: string | null;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const fetchProject = async (id: string) => {
    return Sentry.startSpan(
      {
        op: "ui.action",
        name: "Fetch Project Detail",
      },
      async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/projects/${id}`);

          if (!response.ok) {
            throw new Error("Failed to fetch project");
          }

          const data = await response.json();
          setProject(data.project);
          setError(null);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load project";
          setError(errorMessage);
          Sentry.captureException(err);
        } finally {
          setLoading(false);
        }
      },
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-destructive">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error || "Project not found"}</p>
          <Link
            href="/app/projects"
            className="mt-4 inline-flex items-center gap-2 text-sm hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/app/projects"
            className="rounded-lg border border-border p-2 hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-border px-4 py-2 hover:bg-accent flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Project Info */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Project Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Language</div>
            <div className="font-medium">
              {project.language || "Not specified"}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Framework</div>
            <div className="font-medium">
              {project.framework || "Not specified"}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">Visibility</div>
            <div className="font-medium capitalize">{project.visibility}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Last Accessed
            </div>
            <div className="font-medium">
              {formatDate(project.last_accessed_at)}
            </div>
          </div>
        </div>

        {project.repository_url && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Repository</div>
            <a
              href={project.repository_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              {project.repository_url}
            </a>
          </div>
        )}
      </div>

      {/* Placeholder for IDE/Editor */}
      <div className="rounded-lg border border-border p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">IDE Coming Soon</h3>
        <p className="text-muted-foreground">
          The code editor will be available in Sprint 2
        </p>
      </div>
    </div>
  );
}
