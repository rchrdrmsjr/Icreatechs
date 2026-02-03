import Link from "next/link";

export default function TemplatesPage() {
  const templates = [
    {
      id: "1",
      name: "Next.js Starter",
      description: "Full-stack Next.js app with authentication",
      category: "Web",
    },
    {
      id: "2",
      name: "React Dashboard",
      description: "Admin dashboard with charts and tables",
      category: "Web",
    },
    {
      id: "3",
      name: "REST API",
      description: "Node.js API with Express and TypeScript",
      category: "Backend",
    },
    {
      id: "4",
      name: "Landing Page",
      description: "Marketing landing page with Tailwind",
      category: "Web",
    },
    {
      id: "5",
      name: "Chrome Extension",
      description: "Starter template for browser extensions",
      category: "Extension",
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground">
          Start your project with a pre-built template
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border border-border p-6 hover:bg-accent"
          >
            <div className="mb-2 inline-block rounded bg-muted px-2 py-1 text-xs">
              {template.category}
            </div>
            <div className="mb-2 text-lg font-semibold">{template.name}</div>
            <p className="mb-4 text-sm text-muted-foreground">
              {template.description}
            </p>
            <button className="w-full rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}