import { inngest } from "./client";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

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
