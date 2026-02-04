"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Github, Loader2, FolderOpen } from "lucide-react";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { formatDistanceToNow } from "date-fns";
import * as Sentry from "@sentry/nextjs";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  language: string | null;
  framework: string | null;
  visibility: string;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const fetchProjects = async () => {
    return Sentry.startSpan(
      {
        op: "ui.action",
        name: "Fetch Projects",
      },
      async () => {
        try {
          setLoading(true);
          const response = await fetch("/api/projects");

          if (!response.ok) {
            throw new Error("Failed to fetch projects");
          }

          const data = await response.json();
          setProjects(data.projects || []);
          setError(null);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load projects";
          setError(errorMessage);
          Sentry.captureException(err);
        } finally {
          setLoading(false);
        }
      },
    );
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectCreated = () => {
    setIsCreateDialogOpen(false);
    fetchProjects();
  };

  const formatLastAccessed = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage and collaborate on your projects
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent flex items-center gap-2">
            <Github className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first project
          </p>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/app/projects/${project.id}`}
              className="rounded-lg border border-border p-6 hover:bg-accent transition-colors"
            >
              <div className="mb-2 text-lg font-semibold">{project.name}</div>
              {project.description && (
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-2 mb-3">
                {project.language && (
                  <span className="text-xs bg-accent px-2 py-1 rounded">
                    {project.language}
                  </span>
                )}
                {project.framework && (
                  <span className="text-xs bg-accent px-2 py-1 rounded">
                    {project.framework}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Opened {formatLastAccessed(project.last_accessed_at)}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
