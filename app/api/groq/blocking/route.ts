import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import {
  trackAPIError,
  trackExternalServiceError,
  trackPerformance,
} from "@/lib/error-tracking";
import { createTelemetryConfig } from "@/lib/telemetry-config";

export async function POST(request: NextRequest) {
  return trackPerformance(
    "http.server",
    "POST /api/groq/blocking",
    async () => {
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
        if (!process.env.GROQ_API_KEY) {
          return NextResponse.json(
            { error: "Groq API key is not configured" },
            { status: 500 },
          );
        }

        // Generate text using Groq (llama-3.3-70b-versatile)
        const { text, usage, finishReason } = await generateText({
          model: groq("llama-3.3-70b-versatile"),
          prompt: prompt,
          temperature: 0.7,
          experimental_telemetry: createTelemetryConfig("groq-text-generation"),
        });

        // Return the generated response
        return NextResponse.json({
          success: true,
          data: {
            text,
            usage,
            finishReason,
            model: "llama-3.3-70b-versatile",
            provider: "groq",
          },
        });
      } catch (error) {
        // Track the error in Sentry
        if (error instanceof Error && error.message.includes("API")) {
          trackExternalServiceError("groq", error, {
            operation: "generateText",
            metadata: { model: "llama-3.3-70b-versatile" },
          });
        } else {
          trackAPIError(error, {
            endpoint: "/api/groq/blocking",
            method: "POST",
            statusCode: 500,
          });
        }

        console.error("Error generating text with Groq:", error);

        return NextResponse.json(
          {
            error: "Failed to generate text with Groq",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    },
  );
}

// Sample usage example (for documentation)
// POST /api/groq/blocking
// Body: {
//   "prompt": "Explain the concept of neural networks"
// }
