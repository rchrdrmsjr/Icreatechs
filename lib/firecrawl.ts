import Firecrawl from "@mendable/firecrawl-js";

let firecrawlInstance: Firecrawl | null = null;

/**
 * Get or create a Firecrawl client instance.
 * Lazily initializes the client to avoid import-time failures.
 * @throws {Error} If FIRECRAWL_API_KEY is not configured
 */
export function getFirecrawl(): Firecrawl {
  if (!firecrawlInstance) {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      throw new Error(
        "FIRECRAWL_API_KEY environment variable is not configured",
      );
    }

    firecrawlInstance = new Firecrawl({ apiKey });
  }

  return firecrawlInstance;
}

// Backward compatibility: export a getter that throws if not configured
export const firecrawl = new Proxy({} as Firecrawl, {
  get(_target, prop) {
    return getFirecrawl()[prop as keyof Firecrawl];
  },
});
