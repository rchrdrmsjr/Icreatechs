"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { CodeEditor, type CodeEditorHandle } from "@/components/code-editor";
import {
  ArrowLeft,
  Loader2,
  Settings,
  Play,
  Upload,
  Share2,
  FolderOpen,
  Terminal,
  Monitor,
  Eye,
  Wand2,
  Globe,
} from "lucide-react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileExplorer } from "@/components/file-explorer";
import { EditorTabs } from "@/components/editor-tabs";
import { useEditorStore } from "@/lib/editor-store";
import { ConversationPanel } from "@/components/conversations/conversation-panel";

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

interface ExplorerFile {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
}

const getLanguageFromName = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
      return "typescript";
    case "tsx":
      return "typescript";
    case "js":
      return "javascript";
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "html":
      return "html";
    case "css":
    case "scss":
    case "sass":
      return "scss";
    case "md":
    case "mdx":
      return "markdown";
    case "py":
      return "python";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "java":
      return "java";
    case "cs":
      return "csharp";
    case "cpp":
    case "c":
    case "h":
      return "cpp";
    case "xml":
      return "xml";
    default:
      return "plaintext";
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"code" | "preview">("code");
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const editorRef = useRef<CodeEditorHandle | null>(null);
  const contentByIdRef = useRef<Map<string, string>>(new Map());
  const [aiProvider, setAiProvider] = useState<"gemini" | "groq">("gemini");
  const [aiModel, setAiModel] = useState("gemini-2.5-flash");
  const [selectionText, setSelectionText] = useState("");
  const [selectionStats, setSelectionStats] = useState({ lines: 0, chars: 0 });
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [quickEditInstruction, setQuickEditInstruction] = useState("");
  const [quickEditIncludeExplanation, setQuickEditIncludeExplanation] = useState(false);
  const [quickEditExplanation, setQuickEditExplanation] = useState<string | null>(null);
  const [quickEditLoading, setQuickEditLoading] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeLoading, setScrapeLoading] = useState<"blocking" | "queue" | null>(null);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);
  const availableModels = useMemo<string[]>(
    () =>
      aiProvider === "groq"
        ? ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
        : ["gemini-2.5-flash", "gemini-2.0-flash"],
    [aiProvider],
  );
  const openFiles = useEditorStore((state) => state.openFiles);
  const activeFileId = useEditorStore((state) => state.activeFileId);
  const openFile = useEditorStore((state) => state.openFile);
  const setFileContent = useEditorStore((state) => state.setFileContent);
  const setFileDirty = useEditorStore((state) => state.setFileDirty);
  const setFileLoading = useEditorStore((state) => state.setFileLoading);

  const activeFile = useMemo(
    () => openFiles.find((file) => file.id === activeFileId) ?? null,
    [activeFileId, openFiles],
  );
  const isSavingActive = activeFileId ? savingIds.has(activeFileId) : false;
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoSaveToastAt = useRef<Map<string, number>>(new Map());
  const autoSaveToastThrottleMs = 5000;

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string);
    }
  }, [params.id]);

  const getContentForFile = useCallback(
    (fileId: string, fallback?: string) => {
      const cached = contentByIdRef.current.get(fileId);
      return cached ?? fallback ?? "";
    },
    [],
  );

  useEffect(() => {
    if (!quickEditOpen) {
      setQuickEditInstruction("");
      setQuickEditExplanation(null);
    }
  }, [quickEditOpen]);

  useEffect(() => {
    if (!availableModels.includes(aiModel)) {
      setAiModel(availableModels[0]);
    }
  }, [aiModel, availableModels]);

  const openQuickEdit = useCallback(() => {
    const selection = editorRef.current?.getSelectionText() ?? "";
    if (!selection.trim()) {
      toast("Select code to edit first.");
      return;
    }
    setQuickEditOpen(true);
  }, []);

  const handleQuickEditSubmit = useCallback(async () => {
    if (!activeFile) return;
    const selectionText = editorRef.current?.getSelectionText() ?? "";
    if (!selectionText.trim()) {
      toast("Select code to edit first.");
      return;
    }

    const instruction = quickEditInstruction.trim();
    if (!instruction) {
      toast("Add an instruction for the edit.");
      return;
    }

    setQuickEditLoading(true);
    setQuickEditExplanation(null);

    try {
      const response = await fetch("/api/ai/edit-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selection: selectionText,
          instruction,
          language: activeFile.language,
          filePath: activeFile.path,
          aiProvider,
          model: aiModel,
          includeExplanation: quickEditIncludeExplanation,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to edit selection");
      }

      const updated = payload?.data?.updated ?? "";
      const explanation = payload?.data?.explanation ?? null;
      if (!updated.trim()) {
        throw new Error("AI returned empty output");
      }

      editorRef.current?.replaceSelection(updated);
      setQuickEditExplanation(explanation);
      if (!quickEditIncludeExplanation) {
        setQuickEditOpen(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Quick edit failed";
      toast.error(message);
    } finally {
      setQuickEditLoading(false);
    }
  }, [
    activeFile,
    aiModel,
    aiProvider,
    quickEditIncludeExplanation,
    quickEditInstruction,
  ]);

  const handleSelectionChange = useCallback((selection: string) => {
    if (!selection) {
      setSelectionText("");
      setSelectionStats({ lines: 0, chars: 0 });
      return;
    }
    setSelectionText(selection);
    setSelectionStats({ lines: selection.split("\n").length, chars: selection.length });
  }, []);

  const handleScrape = useCallback(
    async (mode: "blocking" | "queue") => {
      const url = scrapeUrl.trim();
      if (!url) {
        toast("Enter a URL to scrape.");
        return;
      }

      setScrapeLoading(mode);
      setScrapeResult(null);

      try {
        const response = await fetch(
          mode === "blocking" ? "/api/firecrawl/blocking" : "/api/firecrawl/non-blocking",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, formats: ["markdown"] }),
          },
        );

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to scrape URL");
        }

        if (mode === "queue") {
          setScrapeResult(`Queued job ${payload.requestId}`);
        } else {
          const markdown = payload?.data?.markdown ?? "";
          setScrapeResult(
            markdown ? markdown.slice(0, 800) : "Scrape completed with no markdown.",
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to scrape URL";
        toast.error(message);
      } finally {
        setScrapeLoading(null);
      }
    },
    [scrapeUrl],
  );

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

  const saveFile = useCallback(
    async (
      file: { id: string; name: string; content: string },
      source: "manual" | "auto" | "all" = "manual",
    ) => {
      if (!project?.id) return;
      setSavingIds((prev) => new Set(prev).add(file.id));
      setEditorError(null);

      const latestContent = getContentForFile(file.id, file.content);

      try {
        const response = await fetch(
          `/api/projects/${project.id}/files/${file.id}/content`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: latestContent }),
          },
        );

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error || "Failed to save file");
        }

        contentByIdRef.current.set(file.id, latestContent);
        setFileContent(file.id, latestContent, false);
        if (source === "auto") {
          const now = Date.now();
          const lastToast = lastAutoSaveToastAt.current.get(file.id) ?? 0;
          if (now - lastToast >= autoSaveToastThrottleMs) {
            lastAutoSaveToastAt.current.set(file.id, now);
            toast.success(`Auto-saved ${file.name}`, {
              id: `autosave-${file.id}`,
            });
          }
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save file";
        setEditorError(message);
        toast.error(message);
        throw err;
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(file.id);
          return next;
        });
      }
    },
    [getContentForFile, project?.id, setFileContent],
  );

  const saveActiveFile = useCallback(async () => {
    if (!activeFile) return;
    try {
      await saveFile(
        { id: activeFile.id, name: activeFile.name, content: activeFile.content },
        "manual",
      );
    } catch {
      // Errors are handled in saveFile
    }
  }, [activeFile, saveFile]);

  const saveAllDirtyFiles = useCallback(async () => {
    const dirtyFiles = openFiles.filter((file) => file.isDirty);
    if (dirtyFiles.length === 0) return;
    const results = await Promise.allSettled(
      dirtyFiles.map((file) =>
        saveFile(
          { id: file.id, name: file.name, content: file.content },
          "all",
        ),
      ),
    );

    const successCount = results.filter((result) => result.status === "fulfilled")
      .length;
    const totalCount = dirtyFiles.length;

    if (successCount === 0) {
      toast.error("Failed to save files");
      return;
    }

    if (successCount < totalCount) {
      toast.success(`Saved ${successCount} of ${totalCount} files`);
      return;
    }

    toast.success(`Saved ${totalCount} file${totalCount > 1 ? "s" : ""}`);
  }, [openFiles, saveFile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (event.shiftKey) {
          saveAllDirtyFiles();
        } else {
          saveActiveFile();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveActiveFile, saveAllDirtyFiles]);

  useEffect(() => {
    const handleQuickEditKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openQuickEdit();
      }
    };

    window.addEventListener("keydown", handleQuickEditKey);
    return () => window.removeEventListener("keydown", handleQuickEditKey);
  }, [openQuickEdit]);

  useEffect(() => {
    if (!autoSaveEnabled) return;
    if (!activeFile || !activeFile.isDirty) return;
    if (isSavingActive) return;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      void saveFile(
        { id: activeFile.id, name: activeFile.name, content: activeFile.content },
        "auto",
      ).catch(() => {
        // Errors are handled in saveFile
      });
    }, 1200);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [activeFile, autoSaveEnabled, isSavingActive, saveFile]);


  const handleOpenFile = (file: ExplorerFile) => {
    if (file.type !== "file") return;
    openFile({
      id: file.id,
      name: file.name,
      path: file.path,
      language: getLanguageFromName(file.name),
    });
  };

  useEffect(() => {
    if (!project?.id) return;

    const filesToLoad = openFiles.filter((file) => file.isLoading);
    if (filesToLoad.length === 0) return;

    const loadFiles = async () => {
      setEditorError(null);
      for (const file of filesToLoad) {
        try {
          const response = await fetch(
            `/api/projects/${project.id}/files/${file.id}/content`,
          );

          if (!response.ok) {
            const payload = await response.json();
            throw new Error(payload.error || "Failed to load file content");
          }

          const payload = await response.json();
          const loadedContent = payload.content ?? "";
          contentByIdRef.current.set(file.id, loadedContent);
          setFileContent(file.id, loadedContent, false);
          setFileLoading(file.id, false);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to load file content";
          setEditorError(message);
          setFileLoading(file.id, false);
        }
      }
    };

    void loadFiles();
  }, [openFiles, project?.id, setFileContent, setFileLoading]);

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
          <Button
            type="button"
            size="sm"
            variant={workspaceMode === "code" ? "secondary" : "ghost"}
            onClick={() => setWorkspaceMode("code")}
          >
            Code
          </Button>
          <Button
            type="button"
            size="sm"
            variant={workspaceMode === "preview" ? "secondary" : "ghost"}
            onClick={() => setWorkspaceMode("preview")}
          >
            Preview
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
            title="Run Code"
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Run</span>
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
            title="Deploy Project"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Deploy</span>
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
            title="Share Project"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            type="button"
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
        {workspaceMode === "code" ? (
          <>
            {/* File Explorer Panel */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <div className="h-full overflow-y-auto border-r border-border bg-background">
                <div className="p-3">
                  <div className="text-sm">
                    <FileExplorer
                      projectId={project.id}
                      onOpenFile={handleOpenFile}
                    />
                  </div>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Code Editor Panel */}
            <ResizablePanel defaultSize={50} minSize={30} maxSize={80}>
              <div className="h-full flex flex-col bg-muted/30">
                {/* Editor Tabs */}
                <div className="flex items-center justify-between bg-background px-2 py-1">
                  <EditorTabs savingIds={savingIds} />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Auto-save</span>
                    <Switch
                      checked={autoSaveEnabled}
                      onCheckedChange={setAutoSaveEnabled}
                      size="sm"
                      aria-label="Toggle auto-save"
                    />
                  </div>
                </div>
                {/* Editor Container */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  {(editorError || isSavingActive) && (
                    <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2 text-xs">
                      <span className={editorError ? "text-destructive" : "text-muted-foreground"}>
                        {editorError ?? "Saving changes..."}
                      </span>
                      {isSavingActive && (
                        <span className="text-muted-foreground">⌘/Ctrl+S</span>
                      )}
                    </div>
                  )}
                  {activeFile ? (
                    <CodeEditor
                      ref={editorRef}
                      key={activeFile.id}
                      fileName={activeFile.name}
                      value={contentByIdRef.current.get(activeFile.id) ?? activeFile.content}
                      isDirty={activeFile.isDirty}
                      onSelectionChange={handleSelectionChange}
                      onChange={(value) => {
                        if (!activeFileId) return;
                        contentByIdRef.current.set(activeFileId, value);
                        setFileDirty(activeFileId, true);
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-8">
                      <div className="text-center space-y-3">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Select a file to start editing
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                    type="button"
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
                    type="button"
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
                      <div className="rounded-lg bg-muted p-3 text-sm space-y-3">
                        <div className="font-medium flex items-center gap-2">
                          <Wand2 className="h-4 w-4" />
                          AI Tools
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            Quick edit selected code with Cmd/Ctrl+K.
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>Provider</span>
                            <NativeSelect
                              size="sm"
                              value={aiProvider}
                              onChange={(event) =>
                                setAiProvider(event.target.value as "gemini" | "groq")
                              }
                            >
                              <NativeSelectOption value="gemini">Gemini 2.5 Flash</NativeSelectOption>
                              <NativeSelectOption value="groq">Groq Llama 3.3 70B</NativeSelectOption>
                            </NativeSelect>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>Model</span>
                            <NativeSelect
                              size="sm"
                              value={aiModel}
                              onChange={(event) => setAiModel(event.target.value)}
                            >
                              {availableModels.map((modelId: string) => (
                                <NativeSelectOption key={modelId} value={modelId}>
                                  {modelId}
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={openQuickEdit}
                          >
                            Edit Selection
                          </Button>
                        </div>
                        <div className="border-t border-border pt-3 space-y-2">
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5" />
                            Firecrawl scrape
                          </div>
                          <Input
                            placeholder="https://example.com"
                            value={scrapeUrl}
                            onChange={(event) => setScrapeUrl(event.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={scrapeLoading !== null}
                              onClick={() => handleScrape("blocking")}
                            >
                              {scrapeLoading === "blocking" ? "Scraping..." : "Scrape"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={scrapeLoading !== null}
                              onClick={() => handleScrape("queue")}
                            >
                              {scrapeLoading === "queue" ? "Queueing..." : "Queue"}
                            </Button>
                          </div>
                          {scrapeResult && (
                            <div className="rounded-md border border-border bg-background p-2 text-xs text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap">
                              {scrapeResult}
                            </div>
                          )}
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
          </>
        ) : (
          <ResizablePanel defaultSize={100} minSize={100}>
            <div className="h-full flex flex-col bg-background">
              <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
                <div className="text-sm text-muted-foreground">AI Chat</div>
                <div className="text-right text-xs text-muted-foreground">Preview</div>
              </div>
              <ResizablePanelGroup orientation="horizontal" className="flex-1">
                <ResizablePanel defaultSize={30} minSize={20}>
                  <div className="h-full p-4">
                    <div className="h-full min-h-0">
                      <ConversationPanel
                        projectId={project.id}
                        aiProvider={aiProvider}
                        aiModel={aiModel}
                      />
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={70} minSize={45}>
                  <div className="h-full p-4">
                    <div className="h-full rounded-lg border border-border bg-muted/20 p-4 flex items-center justify-center min-h-0">
                      <div className="text-center space-y-2">
                        <Eye className="mx-auto h-8 w-8 text-muted-foreground" />
                        <div className="text-sm font-semibold">Live Preview</div>
                        <div className="text-xs text-muted-foreground">
                          Preview will render your app here
                        </div>
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>

      <Dialog open={quickEditOpen} onOpenChange={setQuickEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Edit</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Applies to your current selection.
            </div>
            <Textarea
              value={quickEditInstruction}
              onChange={(event) => setQuickEditInstruction(event.target.value)}
              placeholder="e.g. Convert to async/await and add error handling"
              rows={4}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Include explanation</span>
              <Switch
                checked={quickEditIncludeExplanation}
                onCheckedChange={setQuickEditIncludeExplanation}
                size="sm"
                aria-label="Toggle explanation"
              />
            </div>
            {quickEditExplanation && (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                {quickEditExplanation}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuickEditOpen(false)}
              disabled={quickEditLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleQuickEditSubmit}
              disabled={quickEditLoading}
            >
              {quickEditLoading ? "Applying..." : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
