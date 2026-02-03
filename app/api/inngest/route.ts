import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  helloWorld,
  generateAIText,
  generateGroqText,
  scrapeWebsite,
  scrapeAndAnalyze,
} from "@/inngest/functions";

// Serve Inngest functions: helloWorld, generateAIText, generateGroqText, scrapeWebsite, scrapeAndAnalyze
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld,
    generateAIText,
    generateGroqText,
    scrapeWebsite,
    scrapeAndAnalyze,
  ],
});
