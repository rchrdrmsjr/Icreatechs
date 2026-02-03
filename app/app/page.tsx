import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const recentProjects = [
    { id: "1", name: "Portfolio Website", updated: "2 hours ago" },
    { id: "2", name: "E-commerce App", updated: "1 day ago" },
    { id: "3", name: "Blog Platform", updated: "3 days ago" },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.email?.split("@")[0]}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border p-6">
          <div className="text-2xl font-bold">12</div>
          <div className="text-sm text-muted-foreground">Total Projects</div>
        </div>
        <div className="rounded-lg border border-border p-6">
          <div className="text-2xl font-bold">8.4k</div>
          <div className="text-sm text-muted-foreground">AI Completions</div>
        </div>
        <div className="rounded-lg border border-border p-6">
          <div className="text-2xl font-bold">24h</div>
          <div className="text-sm text-muted-foreground">Dev Time Saved</div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Link
            href="/app/projects"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {recentProjects.map((project) => (
            <Link
              key={project.id}
              href={`/app/projects/${project.id}`}
              className="block rounded-lg border border-border p-4 hover:bg-accent"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{project.name}</div>
                <div className="text-sm text-muted-foreground">
                  {project.updated}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
