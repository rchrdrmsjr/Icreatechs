"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Settings,
  Play,
  Upload,
  Share2,
  FolderOpen,
  FileCode,
  Terminal,
  Monitor,
  Code,
  Eye,
} from "lucide-react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { formatDistanceToNow } from "date-fns";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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

type ViewMode = "code" | "preview";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("code");

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
    <div className="flex h-screen flex-col bg-background">
      {/* Project Actions Navbar */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href="/app/projects"
            className="rounded-lg p-1.5 hover:bg-accent"
            title="Back to Projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{project.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
            title="Run Code"
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Run</span>
          </button>
          <button
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
            title="Deploy Project"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Deploy</span>
          </button>
          <button
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
            title="Share Project"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
            title="Project Settings"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* IDE Layout with Resizable Panels */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* File Explorer Panel */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full overflow-y-auto border-r border-border bg-background">
            <div className="p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <FileCode className="h-3 w-3" />
                Files
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer">
                  <FileCode className="h-4 w-4 text-blue-500" />
                  <span>index.tsx</span>
                </div>
                <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer">
                  <FileCode className="h-4 w-4 text-blue-500" />
                  <span>app.tsx</span>
                </div>
                <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer">
                  <FileCode className="h-4 w-4 text-purple-500" />
                  <span>styles.css</span>
                </div>
                <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer">
                  <FolderOpen className="h-4 w-4 text-yellow-500" />
                  <span>components/</span>
                </div>
                <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer">
                  <FolderOpen className="h-4 w-4 text-yellow-500" />
                  <span>utils/</span>
                </div>
                <div className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent cursor-pointer">
                  <FileCode className="h-4 w-4 text-green-500" />
                  <span>package.json</span>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Code Editor Panel */}
        <ResizablePanel defaultSize={50} minSize={30} maxSize={80}>
          <div className="h-full flex flex-col bg-muted/30">
            {/* Editor Tabs */}
            <div className="flex items-center gap-1 border-b border-border bg-background px-2 py-1">
              <div className="flex items-center gap-2 rounded bg-accent px-3 py-1.5 text-sm">
                <FileCode className="h-3 w-3" />
                <span>index.tsx</span>
                <button className="ml-1 hover:text-destructive">×</button>
              </div>
            </div>

            {/* Editor Container */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                  <Code className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Monaco Editor</div>
                  <div className="text-sm text-muted-foreground">
                    Code editor will be available in Sprint 2
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {project.language && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1">
                      Language: {project.language}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview/Terminal Panel with Tab Switching */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className="h-full flex flex-col bg-background">
            {/* Code/Preview Tab Switcher */}
            <div className="flex items-center border-b border-border">
              <button
                onClick={() => setViewMode("code")}
                className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
                  viewMode === "code"
                    ? "border-foreground text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Terminal className="h-4 w-4" />
                Terminal
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
                  viewMode === "preview"
                    ? "border-foreground text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Monitor className="h-4 w-4" />
                Preview
              </button>
            </div>

            {/* Terminal/Preview Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {viewMode === "code" ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Terminal Output
                  </div>
                  <div className="rounded-lg bg-muted p-3 font-mono text-xs">
                    <div className="text-green-500">$ npm run dev</div>
                    <div className="text-muted-foreground mt-2">
                      Ready on http://localhost:3000
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <div className="font-medium mb-2">AI Suggestions</div>
                    <div className="text-muted-foreground text-xs space-y-2">
                      <div>• Add error handling to API calls</div>
                      <div>• Consider extracting logic into components</div>
                      <div>• Optimize bundle size</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                      <Eye className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Live Preview</div>
                      <div className="text-sm text-muted-foreground">
                        Preview will render your app here
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
