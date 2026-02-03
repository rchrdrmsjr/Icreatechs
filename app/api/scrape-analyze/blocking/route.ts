import { firecrawl } from "@/lib/firecrawl";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import {
  trackAPIError,
  trackExternalServiceError,
  trackPerformance,
  trackValidationError,
} from "@/lib/error-tracking";

type AIProvider = "gemini" | "groq";

export async function POST(request: NextRequest) {
  return trackPerformance(
    "http.server",
    "POST /api/scrape-analyze/blocking",
    async () => {
      let body: any;
      try {
        // Parse the request body
        body = await request.json();
        const { url, aiProvider = "gemini", analysisPrompt } = body;

        // Validate URL
        if (!url || typeof url !== "string") {
          trackValidationError("url", url, {
            endpoint: "/api/scrape-analyze/blocking",
            expectedType: "string",
          });
          return NextResponse.json(
            { error: "URL is required and must be a string" },
            { status: 400 },
          );
        }

        // Validate and normalize aiProvider
        const normalizedAiProvider =
          typeof aiProvider === "string"
            ? aiProvider.toLowerCase()
            : aiProvider;

        if (
          normalizedAiProvider !== "gemini" &&
          normalizedAiProvider !== "groq"
        ) {
          trackValidationError("aiProvider", aiProvider, {
            endpoint: "/api/scrape-analyze/blocking",
            expectedType: "gemini | groq",
          });
          return NextResponse.json(
            {
              error: "Invalid aiProvider. Must be 'gemini' or 'groq'",
              received: aiProvider,
            },
            { status: 400 },
          );
        }

        // Check if API keys are configured
        if (!process.env.FIRECRAWL_API_KEY) {
          return NextResponse.json(
            { error: "Firecrawl API key is not configured" },
            { status: 500 },
          );
        }

        if (normalizedAiProvider === "groq" && !process.env.GROQ_API_KEY) {
          return NextResponse.json(
            { error: "Groq API key is not configured" },
            { status: 500 },
          );
        }

        if (
          normalizedAiProvider === "gemini" &&
          !process.env.GOOGLE_GENERATIVE_AI_API_KEY
        ) {
          return NextResponse.json(
            { error: "Google Generative AI API key is not configured" },
            { status: 500 },
          );
        }

        // Step 1: Scrape the URL
        const scrapeResult = await firecrawl.scrape(url, {
          formats: ["markdown"],
        });

        // Validate scrape result
        if (!scrapeResult.markdown) {
          return NextResponse.json(
            { error: "Firecrawl returned no markdown content" },
            { status: 422 },
          );
        }

        if (!scrapeResult.metadata) {
          return NextResponse.json(
            { error: "Firecrawl returned no metadata" },
            { status: 422 },
          );
        }

        // Step 2: Analyze with AI
        const prompt = analysisPrompt
          ? `${analysisPrompt}\n\nContent:\n${scrapeResult.markdown}`
          : `Please analyze and summarize the following content:\n\n${scrapeResult.markdown}`;

        let aiResult;
        if (normalizedAiProvider === "groq") {
          const { text, usage, finishReason } = await generateText({
            model: groq("llama-3.3-70b-versatile"),
            prompt: prompt,
            temperature: 0.7,
            experimental_telemetry: {
              isEnabled: true,
              functionId: "groq-scrape-analysis",
              recordInputs: true,
              recordOutputs: true,
            },
          });
          aiResult = {
            analysis: text,
            usage,
            finishReason,
            model: "llama-3.3-70b-versatile",
            provider: "groq",
          };
        } else {
          const { text, usage, finishReason } = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: prompt,
            temperature: 0.7,
            experimental_telemetry: {
              isEnabled: true,
              functionId: "gemini-scrape-analysis",
              recordInputs: true,
              recordOutputs: true,
            },
          });
          aiResult = {
            analysis: text,
            usage,
            finishReason,
            model: "gemini-2.5-flash",
            provider: "gemini",
          };
        }

        // Return combined results
        return NextResponse.json({
          success: true,
          data: {
            scrapedData: {
              markdown: scrapeResult.markdown,
              metadata: scrapeResult.metadata,
              sourceUrl: url,
            },
            aiResult,
          },
        });
      } catch (error) {
        // Track the error with appropriate context
        if (error instanceof Error) {
          if (error.message.includes("Firecrawl")) {
            trackExternalServiceError("firecrawl", error, {
              operation: "scrape",
              metadata: { url: request.url },
            });
          } else if (
            error.message.includes("API") ||
            error.message.includes("generateText")
          ) {
            const provider = body?.aiProvider || "gemini";
            trackExternalServiceError(provider, error, {
              operation: "generateText",
              metadata: { provider },
            });
          } else {
            trackAPIError(error, {
              endpoint: "/api/scrape-analyze/blocking",
              method: "POST",
              statusCode: 500,
            });
          }
        }

        console.error("Error in scrape and analyze:", error);

        return NextResponse.json(
          {
            error: "Failed to scrape and analyze URL",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    },
  );
}

// Sample usage example (for documentation)
// POST /api/scrape-analyze/blocking
// Body: {
//   "url": "https://example.com",
//   "aiProvider": "gemini" or "groq",
//   "analysisPrompt": "Summarize the key points" (optional)
// }
