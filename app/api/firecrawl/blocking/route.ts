import Firecrawl from "@mendable/firecrawl-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { url, formats = ["markdown"] } = body;

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required and must be a string" },
        { status: 400 },
      );
    }

    // Check if API key is configured
    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: "Firecrawl API key is not configured" },
        { status: 500 },
      );
    }

    // Initialize Firecrawl
    const firecrawl = new Firecrawl({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });

    // Scrape the URL
    const result = await firecrawl.scrape(url, {
      formats: formats,
    });

    // Return the scraped data
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        sourceUrl: url,
        scrapedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error scraping with Firecrawl:", error);

    return NextResponse.json(
      {
        error: "Failed to scrape URL with Firecrawl",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Sample usage example (for documentation)
// POST /api/firecrawl/blocking
// Body: {
//   "url": "https://example.com",
//   "formats": ["markdown", "html"]
// }
