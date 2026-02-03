import Link from "next/link";

export default function ProjectSettingsPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/app/projects/${params.projectId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back to editor
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Project Settings</h1>
        <p className="text-muted-foreground">
          Configure your project settings and preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-border p-6">
          <h3 className="mb-4 font-semibold">General</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Project Name
              </label>
              <input
                type="text"
                defaultValue="Portfolio Website"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Add a description..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h3 className="mb-4 font-semibold">Deployment</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Production URL
              </label>
              <input
                type="text"
                placeholder="https://your-site.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Build Command
              </label>
              <input
                type="text"
                defaultValue="npm run build"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
          <h3 className="mb-2 font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Once you delete a project, there is no going back.
          </p>
          <button className="rounded-lg border border-red-500 px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400">
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
}