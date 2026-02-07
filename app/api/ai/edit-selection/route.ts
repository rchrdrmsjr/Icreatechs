import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createTelemetryConfig } from "@/lib/telemetry-config";
import * as Sentry from "@sentry/nextjs";

type EditSelectionPayload = {
  selection: string;
  instruction: string;
  language?: string | null;
  filePath?: string | null;
  aiProvider?: "gemini" | "groq";
  includeExplanation?: boolean;
  model?: string;
};

const GEMINI_MODELS = new Set(["gemini-2.5-flash", "gemini-2.0-flash"]);
const GROQ_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
]);

const MAX_SELECTION_CHARS = 8000;

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/ai/edit-selection",
    },
    async () => {
      let providerTag: "gemini" | "groq" = "gemini";
      try {
        const body = (await request.json()) as EditSelectionPayload;
        const {
          selection,
          instruction,
          language,
          filePath,
          aiProvider = "gemini",
          includeExplanation = false,
          model,
        } = body;

        providerTag = aiProvider;

        if (!selection || typeof selection !== "string") {
          return NextResponse.json(
            { error: "selection is required and must be a string" },
            { status: 400 },
          );
        }

        if (!instruction || typeof instruction !== "string") {
          return NextResponse.json(
            { error: "instruction is required and must be a string" },
            { status: 400 },
          );
        }

        if (selection.length > MAX_SELECTION_CHARS) {
          return NextResponse.json(
            { error: "Selection is too large for quick edit" },
            { status: 413 },
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

        const prompt = includeExplanation
          ? [
              "You are a code editor.",
              "Apply the instruction to the selected code.",
              "Return strict JSON with keys updated and explanation.",
              "The updated value must contain only the updated code.",
              "Do not wrap in code fences or add extra keys.",
              "",
              `Language: ${language ?? "plaintext"}`,
              `Path: ${filePath ?? "unknown"}`,
              "",
              "Instruction:",
              instruction.trim(),
              "",
              "Selected code:",
              selection,
              "",
              "JSON:",
            ].join("\n")
          : [
              "You are a code editor.",
              "Apply the instruction to the selected code.",
              "Return only the updated code. No code fences or explanations.",
              "",
              `Language: ${language ?? "plaintext"}`,
              `Path: ${filePath ?? "unknown"}`,
              "",
              "Instruction:",
              instruction.trim(),
              "",
              "Selected code:",
              selection,
              "",
              "Updated code:",
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
            aiProvider === "groq" ? "groq-quick-edit" : "gemini-quick-edit",
          ),
        });

        const cleaned = text.replace(/\r/g, "").trimEnd();
        let updated = cleaned;
        let explanation: string | undefined;

        if (includeExplanation) {
          try {
            const parsed = JSON.parse(cleaned);
            if (typeof parsed?.updated === "string") {
              updated = parsed.updated.trimEnd();
            }
            if (typeof parsed?.explanation === "string") {
              explanation = parsed.explanation.trim();
            }
          } catch {
            updated = cleaned;
          }
        }

        return NextResponse.json({
          success: true,
          data: { updated, explanation },
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            endpoint: "/api/ai/edit-selection",
            provider: providerTag,
          },
        });

        return NextResponse.json(
          {
            error: "Failed to edit selection",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    },
  );
}
