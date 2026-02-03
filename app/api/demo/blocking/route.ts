import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

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

    // Check if API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "Google Generative AI API key is not configured" },
        { status: 500 },
      );
    }

    // Generate text using Gemini 2.5 Flash
    const { text, usage, finishReason } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: prompt,
      temperature: 0.7,
    });

    // Return the generated response
    return NextResponse.json({
      success: true,
      data: {
        text,
        usage,
        finishReason,
        model: "gemini-2.5-flash",
      },
    });
  } catch (error) {
    console.error("Error generating text:", error);

    return NextResponse.json(
      {
        error: "Failed to generate text",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Sample usage example (for documentation)
// POST /api/demo/blocking
// Body: {
//   "prompt": "Explain quantum computing in simple terms"
// }
