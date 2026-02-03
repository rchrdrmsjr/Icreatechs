import { inngest } from "@/inngest/client";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

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

    // Generate a unique request ID
    const requestId = randomUUID();

    // Send event to Inngest (non-blocking)
    await inngest.send({
      name: "firecrawl/scrape.url",
      data: {
        url,
        requestId,
        formats,
      },
    });

    // Return immediately with request ID
    return NextResponse.json({
      success: true,
      message: "Firecrawl scraping job queued successfully",
      requestId,
      url,
      formats,
      note: "The scraping is running in the background. Check the Inngest dashboard or logs for results.",
    });
  } catch (error) {
    console.error("Error queueing Firecrawl scraping:", error);

    return NextResponse.json(
      {
        error: "Failed to queue Firecrawl scraping",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Sample usage example (for documentation)
// POST /api/firecrawl/non-blocking
// Body: {
//   "url": "https://example.com",
//   "formats": ["markdown", "html"]
// }
// Response: {
//   "success": true,
//   "message": "Firecrawl scraping job queued successfully",
//   "requestId": "550e8400-e29b-41d4-a716-446655440000",
//   "url": "https://example.com",
//   "formats": ["markdown", "html"]
// }
