import Link from "next/link";

export default function ProjectEditorPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <div className="flex h-screen flex-col">
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/app/projects"
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Link>
          <div>
            <div className="font-semibold">Portfolio Website</div>
            <div className="text-xs text-muted-foreground">
              Project #{params.projectId}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/app/projects/${params.projectId}/settings`}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Settings
          </Link>
          <button className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:opacity-90">
            Deploy
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 border-r border-border overflow-y-auto">
          <div className="p-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              FILES
            </div>
            <div className="space-y-1 text-sm">
              <div className="rounded px-2 py-1 hover:bg-accent">📄 index.tsx</div>
              <div className="rounded px-2 py-1 hover:bg-accent">📄 app.tsx</div>
              <div className="rounded px-2 py-1 hover:bg-accent">📄 styles.css</div>
              <div className="rounded px-2 py-1 hover:bg-accent">📁 components/</div>
              <div className="rounded px-2 py-1 hover:bg-accent">📁 utils/</div>
            </div>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 bg-muted/20">
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mb-2 text-4xl">⌨️</div>
              <div className="text-sm">AI Code Editor</div>
              <div className="text-xs">Select a file to start editing</div>
            </div>
          </div>
        </div>

        {/* AI Panel */}
        <div className="w-80 border-l border-border overflow-y-auto">
          <div className="p-4">
            <div className="mb-4 text-sm font-medium">AI Assistant</div>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <div className="font-medium">Suggestion</div>
                <div className="text-muted-foreground text-xs">
                  Add error handling to the API call
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="font-medium">Code Review</div>
                <div className="text-muted-foreground text-xs">
                  Consider extracting this logic into a separate component
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}