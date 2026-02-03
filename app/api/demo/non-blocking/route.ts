import { inngest } from "@/inngest/client";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { extractUrl, shouldUseWebSearch } from "@/lib/web-search";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { prompt } = body;

    // Validate prompt
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 },
      );
    }

    // Generate a unique request ID
    const requestId = randomUUID();

    // Check if web search is needed
    const useWebSearch = shouldUseWebSearch(prompt);
    const url = extractUrl(prompt);

    if (useWebSearch && url) {
      // Web search mode: Queue scrape and analyze job
      const cleanPrompt = prompt
        .replace(url, "")
        .replace(/use web search|search web|scrape|from website|from url/gi, "")
        .trim();

      await inngest.send({
        name: "ai/scrape.analyze",
        data: {
          url,
          requestId,
          aiProvider: "gemini",
          analysisPrompt: cleanPrompt || undefined,
        },
      });

      return NextResponse.json({
        success: true,
        mode: "web-search",
        message: "Scrape and analyze job queued successfully",
        requestId,
        url,
        note: "The scraping and AI analysis is running in the background. Check the Inngest dashboard or logs for results.",
      });
    }

    // Normal mode: Queue regular AI generation
    await inngest.send({
      name: "ai/generate.text",
      data: {
        prompt,
        requestId,
      },
    });

    // Return immediately with request ID
    return NextResponse.json({
      success: true,
      mode: "direct",
      message: "AI generation job queued successfully",
      requestId,
      note: "The AI generation is running in the background. Check the Inngest dashboard or logs for results.",
    });
  } catch (error) {
    console.error("Error queueing AI generation:", error);

    return NextResponse.json(
      {
        error: "Failed to queue AI generation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Sample usage example (for documentation)
// POST /api/demo/non-blocking
// Body: {
//   "prompt": "Explain quantum computing in simple terms"
// }
// Response: {
//   "success": true,
//   "message": "AI generation job queued successfully",
//   "requestId": "550e8400-e29b-41d4-a716-446655440000"
// }
