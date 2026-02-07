import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createTelemetryConfig } from "@/lib/telemetry-config";
import * as Sentry from "@sentry/nextjs";

type InlineSuggestPayload = {
  prefix: string;
  suffix?: string;
  language?: string | null;
  filePath?: string | null;
  aiProvider?: "gemini" | "groq";
  model?: string;
};

const GEMINI_MODELS = new Set(["gemini-2.5-flash", "gemini-2.0-flash"]);
const GROQ_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
]);

const MAX_PREFIX_CHARS = 2400;
const MAX_SUFFIX_CHARS = 800;
const MAX_SUGGESTION_CHARS = 400;

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/ai/inline-suggest",
    },
    async () => {
      try {
        const body = (await request.json()) as InlineSuggestPayload;
        const {
          prefix,
          suffix = "",
          language,
          filePath,
          aiProvider = "gemini",
          model,
        } = body;

        if (!prefix || typeof prefix !== "string") {
          return NextResponse.json(
            { error: "prefix is required and must be a string" },
            { status: 400 },
          );
        }

        if (aiProvider === "groq") {
          if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
              { error: "Groq API key is not configured" },
              { status: 500 },
            );
          }
        } else if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          return NextResponse.json(
            { error: "Google Generative AI API key is not configured" },
            { status: 500 },
          );
        }

        const safePrefix = prefix.slice(-MAX_PREFIX_CHARS);
        const safeSuffix = suffix.slice(0, MAX_SUFFIX_CHARS);

        const prompt = [
          "You are an inline code completion engine.",
          "Continue the code at the cursor.",
          "Return only the exact text to insert at the cursor.",
          "Do not wrap in code fences or add commentary.",
          "Keep it short and stop at a natural boundary.",
          "",
          `Language: ${language ?? "plaintext"}`,
          `Path: ${filePath ?? "unknown"}`,
          "",
          "Prefix:",
          safePrefix,
          "",
          "Suffix:",
          safeSuffix,
          "",
          "Completion:",
        ].join("\n");

        const selectedModel =
          aiProvider === "groq"
            ? GROQ_MODELS.has(model ?? "")
              ? model ?? "llama-3.3-70b-versatile"
              : "llama-3.3-70b-versatile"
            : GEMINI_MODELS.has(model ?? "")
              ? model ?? "gemini-2.5-flash"
              : "gemini-2.5-flash";

        const { text } = await generateText({
          model:
            aiProvider === "groq"
              ? groq(selectedModel)
              : google(selectedModel),
          prompt,
          temperature: 0.2,
          experimental_telemetry: createTelemetryConfig(
            aiProvider === "groq" ? "groq-inline-suggest" : "gemini-inline-suggest",
          ),
        });

        const cleaned = text.replace(/\r/g, "");
        if (!cleaned.trim()) {
          return NextResponse.json({
            success: true,
            data: { suggestion: "" },
          });
        }

        const suggestion = cleaned.trimEnd().slice(0, MAX_SUGGESTION_CHARS);

        return NextResponse.json({
          success: true,
          data: { suggestion },
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            endpoint: "/api/ai/inline-suggest",
            provider: "gemini",
          },
        });

        return NextResponse.json(
          {
            error: "Failed to generate inline suggestion",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    },
  );
}
