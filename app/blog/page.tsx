import { Navbar } from "@/components/navbar";

export default function BlogPage() {
  const posts = [
    {
      title: "Introducing AI-Powered Refactoring",
      date: "January 28, 2026",
      excerpt:
        "Learn how our new AI refactoring tools can help you clean up legacy code and improve maintainability in seconds.",
    },
    {
      title: "Building Real-Time Collaboration Features",
      date: "January 15, 2026",
      excerpt:
        "A deep dive into how we built multiplayer editing with operational transforms and conflict resolution.",
    },
    {
      title: "Why We Chose Next.js for Our Platform",
      date: "December 10, 2025",
      excerpt:
        "An inside look at our tech stack and why Next.js was the perfect fit for performance and developer experience.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="px-4 py-16">
        <div className="container mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold">Blog</h1>
          <p className="mb-12 text-lg text-muted-foreground">
            Insights, tutorials, and updates from the iCreaTechs team.
          </p>

          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.title}
                className="rounded-lg border border-border p-6 hover:border-foreground/20"
              >
                <h2 className="mb-2 text-2xl font-semibold">{post.title}</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {post.date}
                </p>
                <p className="text-muted-foreground">{post.excerpt}</p>
                <a
                  href="#"
                  className="mt-4 inline-block text-sm hover:underline"
                >
                  Read more →
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
