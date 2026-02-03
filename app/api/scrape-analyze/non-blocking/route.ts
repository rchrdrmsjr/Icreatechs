import { inngest } from "@/inngest/client";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

type AIProvider = "gemini" | "groq";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { url, aiProvider = "gemini", analysisPrompt } = body;

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required and must be a string" },
        { status: 400 },
      );
    }

    // Validate and normalize aiProvider
    const normalizedAiProvider =
      typeof aiProvider === "string" ? aiProvider.toLowerCase() : aiProvider;

    if (normalizedAiProvider !== "gemini" && normalizedAiProvider !== "groq") {
      return NextResponse.json(
        {
          error: "Invalid aiProvider. Must be 'gemini' or 'groq'",
          received: aiProvider,
        },
        { status: 400 },
      );
    }

    // Generate a unique request ID
    const requestId = randomUUID();

    // Send event to Inngest (non-blocking)
    await inngest.send({
      name: "ai/scrape.analyze",
      data: {
        url,
        requestId,
        aiProvider: normalizedAiProvider as AIProvider,
        analysisPrompt,
      },
    });

    // Return immediately with request ID
    return NextResponse.json({
      success: true,
      message: "Scrape and analyze job queued successfully",
      requestId,
      url,
      aiProvider: normalizedAiProvider,
      note: "The scraping and AI analysis is running in the background. Check the Inngest dashboard or logs for results.",
    });
  } catch (error) {
    console.error("Error queueing scrape and analyze:", error);

    return NextResponse.json(
      {
        error: "Failed to queue scrape and analyze job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Sample usage example (for documentation)
// POST /api/scrape-analyze/non-blocking
// Body: {
//   "url": "https://example.com",
//   "aiProvider": "gemini" or "groq",
//   "analysisPrompt": "Summarize the key points" (optional)
// }
// Response: {
//   "success": true,
//   "message": "Scrape and analyze job queued successfully",
//   "requestId": "550e8400-e29b-41d4-a716-446655440000",
//   "url": "https://example.com",
//   "aiProvider": "gemini"
// }
