import { Navbar } from "@/components/navbar";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      items: ["Quick Start", "Installation", "Your First Project"],
    },
    {
      title: "Core Concepts",
      items: ["Projects", "AI Completions", "Collaboration", "Deployments"],
    },
    {
      title: "API Reference",
      items: ["Authentication", "Projects API", "Files API", "Webhooks"],
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold">Documentation</h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Learn how to integrate and use iCreaTechs in your workflow.
          </p>

          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-lg border border-border p-6">
            <h3 className="mb-2 text-lg font-semibold">Need help?</h3>
            <p className="text-sm text-muted-foreground">
              Join our community on Discord or reach out to support@icreatechs.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}