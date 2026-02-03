import { Navbar } from "@/components/navbar";

export default function ChangelogPage() {
  const updates = [
    {
      version: "v2.1.0",
      date: "February 1, 2026",
      items: [
        "Added multi-cursor AI suggestions",
        "Improved code refactoring performance",
        "New dark mode theme variants",
      ],
    },
    {
      version: "v2.0.0",
      date: "January 15, 2026",
      items: [
        "Complete UI redesign",
        "Real-time collaboration",
        "Team workspaces",
        "Enhanced AI model with 40% faster responses",
      ],
    },
    {
      version: "v1.8.5",
      date: "December 20, 2025",
      items: [
        "Bug fixes for file sync",
        "Performance improvements",
        "Security updates",
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-4 py-16">
        <div className="container mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold">Changelog</h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Stay up to date with new features, improvements, and bug fixes.
          </p>

          <div className="space-y-8">
            {updates.map((update) => (
              <div key={update.version} className="border-l-2 border-border pl-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{update.version}</h2>
                  <p className="text-sm text-muted-foreground">{update.date}</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {update.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-foreground">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}