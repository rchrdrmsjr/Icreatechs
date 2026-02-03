import { inngest } from "./client";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { firecrawl } from "@/lib/firecrawl";
import {
  trackInngestError,
  trackExternalServiceError,
} from "@/lib/error-tracking";
import { createTelemetryConfig } from "@/lib/telemetry-config";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);

export const generateAIText = inngest.createFunction(
  { id: "generate-ai-text" },
  { event: "ai/generate.text" },
  async ({ event, step }) => {
    const { prompt, requestId } = event.data;

    // Step 1: Log the start
    await step.run("log-start", async () => {
      console.log(`Starting AI generation for request: ${requestId}`);
      return { status: "started" };
    });

    // Step 2: Generate text using Gemini 2.5 Flash
    const result = await step.run("generate-text", async () => {
      const { text, usage, finishReason } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: prompt,
        temperature: 0.7,
        experimental_telemetry: createTelemetryConfig(
          "inngest-gemini-background",
        ),
      });

      return {
        text,
        usage,
        finishReason,
        model: "gemini-2.5-flash",
      };
    });

    // Step 3: Log completion
    await step.run("log-completion", async () => {
      console.log(`Completed AI generation for request: ${requestId}`);
      return { status: "completed" };
    });

    return {
      requestId,
      success: true,
      data: result,
    };
  },
);

export const generateGroqText = inngest.createFunction(
  { id: "generate-groq-text" },
  { event: "ai/generate.groq" },
  async ({ event, step }) => {
    const { prompt, requestId } = event.data;

    // Step 1: Log the start
    await step.run("log-start", async () => {
      console.log(`Starting Groq AI generation for request: ${requestId}`);
      return { status: "started" };
    });

    // Step 2: Generate text using Groq (llama-3.3-70b-versatile)
    const result = await step.run("generate-text-groq", async () => {
      const { text, usage, finishReason } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: prompt,
        temperature: 0.7,
        experimental_telemetry: createTelemetryConfig(
          "inngest-groq-background",
        ),
      });

      return {
        text,
        usage,
        finishReason,
        model: "llama-3.3-70b-versatile",
        provider: "groq",
      };
    });

    // Step 3: Log completion
    await step.run("log-completion", async () => {
      console.log(`Completed Groq AI generation for request: ${requestId}`);
      return { status: "completed" };
    });

    return {
      requestId,
      success: true,
      data: result,
    };
  },
);

export const scrapeWebsite = inngest.createFunction(
  { id: "scrape-website" },
  { event: "firecrawl/scrape.url" },
  async ({ event, step }) => {
    const { url, requestId, formats = ["markdown"] } = event.data;

    // Step 1: Log the start
    await step.run("log-start", async () => {
      console.log(`Starting Firecrawl scraping for request: ${requestId}`);
      return { status: "started", url };
    });

    // Step 2: Scrape the URL using Firecrawl
    const result = await step.run("scrape-url", async () => {
      if (!process.env.FIRECRAWL_API_KEY) {
        throw new Error("FIRECRAWL_API_KEY is not configured");
      }

      try {
        const scrapeResult = await firecrawl.scrape(url, {
          formats: formats,
        });

        // Validate scrape result has content
        if (
          !scrapeResult.markdown &&
          !scrapeResult.html &&
          !scrapeResult.rawHtml
        ) {
          throw new Error(
            "Firecrawl returned no content in any requested format",
          );
        }

        return {
          ...scrapeResult,
          sourceUrl: url,
          scrapedAt: new Date().toISOString(),
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`Firecrawl scrape failed for ${url}:`, errorMessage);
        throw new Error(`Failed to scrape URL: ${errorMessage}`);
      }
    });

    // Step 3: Log completion
    await step.run("log-completion", async () => {
      console.log(`Completed Firecrawl scraping for request: ${requestId}`);
      return { status: "completed" };
    });

    return {
      requestId,
      success: true,
      data: result,
    };
  },
);

export const scrapeAndAnalyze = inngest.createFunction(
  { id: "scrape-and-analyze" },
  { event: "ai/scrape.analyze" },
  async ({ event, step }) => {
    const {
      url,
      requestId,
      aiProvider = "gemini",
      analysisPrompt,
    } = event.data;

    // Validate aiProvider
    if (aiProvider !== "gemini" && aiProvider !== "groq") {
      throw new Error(
        `Invalid aiProvider: ${aiProvider}. Must be 'gemini' or 'groq'`,
      );
    }

    // Step 1: Scrape the URL with Firecrawl
    const scrapedData = await step.run("scrape-url", async () => {
      if (!process.env.FIRECRAWL_API_KEY) {
        throw new Error("FIRECRAWL_API_KEY is not configured");
      }

      console.log(`Scraping URL for request: ${requestId}`);

      try {
        const scrapeResult = await firecrawl.scrape(url, {
          formats: ["markdown"],
        });

        // Validate scrape result
        if (!scrapeResult.markdown) {
          throw new Error("Firecrawl returned no markdown content");
        }

        if (!scrapeResult.metadata) {
          throw new Error("Firecrawl returned no metadata");
        }

        return {
          markdown: scrapeResult.markdown,
          metadata: scrapeResult.metadata,
          sourceUrl: url,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`Firecrawl scrape failed for ${url}:`, errorMessage);
        throw new Error(`Failed to scrape URL: ${errorMessage}`);
      }
    });

    // Step 2: Generate AI analysis
    const aiResult = await step.run("analyze-with-ai", async () => {
      console.log(
        `Analyzing content with ${aiProvider} for request: ${requestId}`,
      );

      const prompt = analysisPrompt
        ? `${analysisPrompt}\n\nContent:\n${scrapedData.markdown}`
        : `Please analyze and summarize the following content:\n\n${scrapedData.markdown}`;

      let text, usage, finishReason;

      if (aiProvider === "groq") {
        if (!process.env.GROQ_API_KEY) {
          throw new Error("GROQ_API_KEY is not configured");
        }
        const result = await generateText({
          model: groq("llama-3.3-70b-versatile"),
          prompt: prompt,
          temperature: 0.7,
          experimental_telemetry: createTelemetryConfig(
            "inngest-groq-scrape-analysis",
          ),
        });
        text = result.text;
        usage = result.usage;
        finishReason = result.finishReason;
      } else {
        // Default to Gemini
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
        }
        const result = await generateText({
          model: google("gemini-2.5-flash"),
          prompt: prompt,
          temperature: 0.7,
          experimental_telemetry: createTelemetryConfig(
            "inngest-gemini-scrape-analysis",
          ),
        });
        text = result.text;
        usage = result.usage;
        finishReason = result.finishReason;
      }

      return {
        analysis: text,
        usage,
        finishReason,
        model:
          aiProvider === "groq"
            ? "llama-3.3-70b-versatile"
            : "gemini-2.5-flash",
        provider: aiProvider,
      };
    });

    // Step 3: Log completion
    await step.run("log-completion", async () => {
      console.log(`Completed scrape and analyze for request: ${requestId}`);
      return { status: "completed" };
    });

    return {
      requestId,
      success: true,
      data: {
        scrapedData,
        aiResult,
      },
    };
  },
);
