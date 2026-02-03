import Link from "next/link";

export default function ProjectsPage() {
  const projects = [
    { id: "1", name: "Portfolio Website", language: "Next.js", updated: "2 hours ago" },
    { id: "2", name: "E-commerce App", language: "React", updated: "1 day ago" },
    { id: "3", name: "Blog Platform", language: "Vue.js", updated: "3 days ago" },
    { id: "4", name: "Mobile App", language: "React Native", updated: "1 week ago" },
    { id: "5", name: "API Service", language: "Node.js", updated: "2 weeks ago" },
  ];

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage and collaborate on your projects
          </p>
        </div>
        <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          New Project
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/app/projects/${project.id}`}
            className="rounded-lg border border-border p-6 hover:bg-accent"
          >
            <div className="mb-2 text-lg font-semibold">{project.name}</div>
            <div className="mb-4 text-sm text-muted-foreground">
              {project.language}
            </div>
            <div className="text-xs text-muted-foreground">
              Updated {project.updated}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}