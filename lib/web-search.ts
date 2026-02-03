// Helper function to extract URL from text
export function extractUrl(text: string): string | null {
  // Match URLs but stop before common trailing punctuation
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = text.match(urlRegex);

  if (!match) {
    return null;
  }

  // Remove trailing punctuation that's commonly not part of URLs
  const url = match[0].replace(/[.,;:!?)}\]]+$/, "");

  return url || null;
}

// Helper function to check if web search is requested
export function shouldUseWebSearch(text: string): boolean {
  const keywords = [
    "use web search",
    "search web",
    "scrape",
    "from website",
    "from url",
  ];
  return keywords.some((keyword) => text.toLowerCase().includes(keyword));
}
