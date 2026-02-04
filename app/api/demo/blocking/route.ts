import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { firecrawl } from "@/lib/firecrawl";
import { extractUrl, shouldUseWebSearch } from "@/lib/web-search";
import { createTelemetryConfig } from "@/lib/telemetry-config";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/demo/blocking",
    },
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
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          return NextResponse.json(
            { error: "Google Generative AI API key is not configured" },
            { status: 500 },
          );
        }

        // Check if web search is needed
        const useWebSearch = shouldUseWebSearch(prompt);
        const url = extractUrl(prompt);

        if (useWebSearch && url) {
          // Web search mode: Scrape then analyze
          if (!process.env.FIRECRAWL_API_KEY) {
            return NextResponse.json(
              { error: "Firecrawl API key is not configured for web search" },
              { status: 500 },
            );
          }

          // Scrape the URL
          const scrapeResult = await firecrawl.scrape(url, {
            formats: ["markdown"],
          });

          // Extract the question/prompt without the URL and web search keywords
          const cleanPrompt = prompt
            .replace(url, "")
            .replace(
              /use web search|search web|scrape|from website|from url/gi,
              "",
            )
            .trim();

          // Generate analysis with scraped content
          const analysisPrompt = cleanPrompt
            ? `${cleanPrompt}\n\nBased on the following content from ${url}:\n\n${scrapeResult.markdown}`
            : `Please analyze and summarize the following content from ${url}:\n\n${scrapeResult.markdown}`;

          const { text, usage, finishReason } = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: analysisPrompt,
            temperature: 0.7,
            experimental_telemetry: createTelemetryConfig(
              "gemini-web-search-analysis",
            ),
          });

          return NextResponse.json({
            success: true,
            mode: "web-search",
            data: {
              text,
              usage,
              finishReason,
              model: "gemini-2.5-flash",
              scrapedUrl: url,
              metadata: scrapeResult.metadata,
            },
          });
        }

        // Normal mode: Direct AI generation
        const { text, usage, finishReason } = await generateText({
          model: google("gemini-2.5-flash"),
          prompt: prompt,
          temperature: 0.7,
          experimental_telemetry: createTelemetryConfig(
            "gemini-direct-generation",
          ),
        });

        // Return the generated response
        return NextResponse.json({
          success: true,
          mode: "direct",
          data: {
            text,
            usage,
            finishReason,
            model: "gemini-2.5-flash",
          },
        });
      } catch (error) {
        // Capture exception in Sentry
        Sentry.captureException(error, {
          tags: {
            endpoint: "/api/demo/blocking",
            provider: "gemini",
          },
        });

        console.error("Error generating text:", error);

        return NextResponse.json(
          {
            error: "Failed to generate text",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    },
  );
}

// Sample usage example (for documentation)
// POST /api/demo/blocking
// Body: {
//   "prompt": "Explain quantum computing in simple terms"
// }
