# ✅ Vercel AI SDK Integration with Sentry - Complete!

## 🎯 What Was Implemented

The Vercel AI SDK integration with Sentry provides automatic instrumentation and performance tracking for all AI model calls in your application.

### ✅ Updated Configuration Files

1. **[sentry.server.config.ts](sentry.server.config.ts)** - Added `Sentry.vercelAIIntegration()`
2. **[sentry.edge.config.ts](sentry.edge.config.ts)** - Added `Sentry.vercelAIIntegration()` (manually enabled)
3. **[instrumentation-client.ts](instrumentation-client.ts)** - Added `Sentry.vercelAIIntegration()`

### ✅ Updated API Routes with Telemetry

All `generateText()` calls now include `experimental_telemetry`:

| File                                                                                 | Function ID                  | Model                   |
| ------------------------------------------------------------------------------------ | ---------------------------- | ----------------------- |
| [app/api/demo/blocking/route.ts](app/api/demo/blocking/route.ts)                     | `gemini-direct-generation`   | gemini-2.5-flash        |
| [app/api/demo/blocking/route.ts](app/api/demo/blocking/route.ts)                     | `gemini-web-search-analysis` | gemini-2.5-flash        |
| [app/api/groq/blocking/route.ts](app/api/groq/blocking/route.ts)                     | `groq-text-generation`       | llama-3.3-70b-versatile |
| [app/api/scrape-analyze/blocking/route.ts](app/api/scrape-analyze/blocking/route.ts) | `groq-scrape-analysis`       | llama-3.3-70b-versatile |
| [app/api/scrape-analyze/blocking/route.ts](app/api/scrape-analyze/blocking/route.ts) | `gemini-scrape-analysis`     | gemini-2.5-flash        |

### ✅ Updated Inngest Functions with Telemetry

All background job AI calls now include telemetry:

| File                                         | Function                  | Function ID                      | Model                   |
| -------------------------------------------- | ------------------------- | -------------------------------- | ----------------------- |
| [inngest/functions.ts](inngest/functions.ts) | generateAIText            | `inngest-gemini-background`      | gemini-2.5-flash        |
| [inngest/functions.ts](inngest/functions.ts) | generateGroqText          | `inngest-groq-background`        | llama-3.3-70b-versatile |
| [inngest/functions.ts](inngest/functions.ts) | scrapeAndAnalyze (Groq)   | `inngest-groq-scrape-analysis`   | llama-3.3-70b-versatile |
| [inngest/functions.ts](inngest/functions.ts) | scrapeAndAnalyze (Gemini) | `inngest-gemini-scrape-analysis` | gemini-2.5-flash        |

## 📊 Telemetry Configuration

Every AI call now includes:

```typescript
experimental_telemetry: {
  isEnabled: true,
  functionId: "unique-function-identifier",
  recordInputs: true,
  recordOutputs: true,
}
```

### What Each Property Does:

- **`isEnabled: true`** - Enables telemetry for this specific call
- **`functionId`** - Unique identifier to correlate calls in Sentry
- **`recordInputs: true`** - Records the prompt/input sent to the AI model
- **`recordOutputs: true`** - Records the AI model's response

## 🚀 What You Get

### 1. **Performance Tracking**

- See how long each AI generation takes
- Track response times across different models (Gemini vs Groq)
- Identify slow AI calls that need optimization

### 2. **Function Identification**

- Easy correlation in Sentry dashboard
- Filter by specific AI operations:
  - Direct text generation
  - Web search analysis
  - Scrape and analyze
  - Background jobs

### 3. **Input/Output Recording**

- Debug AI responses by seeing exactly what was sent and received
- Understand why certain prompts produced specific results
- Track token usage and costs

### 4. **Automatic Span Creation**

- Each AI call creates a span in Sentry
- Nested spans show the complete request flow
- See the full trace from API call → Firecrawl → AI generation → Response

## 📈 Viewing AI Traces in Sentry

1. **Go to Sentry Performance Dashboard:**

   ```
   https://sentry.io/organizations/richard-ramos-jr/performance/
   ```

2. **Filter by AI function IDs:**
   - `gemini-direct-generation`
   - `gemini-web-search-analysis`
   - `groq-text-generation`
   - `inngest-gemini-background`
   - `inngest-groq-background`

3. **View span details:**
   - Duration (how long the AI call took)
   - Inputs (the prompt sent)
   - Outputs (the AI response)
   - Token usage
   - Model information

## 🧪 Test the Integration

### 1. Make an AI API call:

```bash
curl -X POST http://localhost:3000/api/demo/blocking \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing in simple terms"}'
```

### 2. Check Sentry Dashboard:

Visit: https://sentry.io/organizations/richard-ramos-jr/performance/

You should see:

- A new trace for the API call
- AI generation span with `functionId: gemini-direct-generation`
- Input/output details
- Performance metrics

### 3. Test Background Jobs:

```bash
curl -X POST http://localhost:3000/api/demo/non-blocking \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a haiku about coding"}'
```

Check:

- Inngest Dashboard: http://localhost:8288
- Sentry Performance: Filter by `inngest-gemini-background`

## 💡 Example Telemetry Output in Sentry

When you make an AI call, Sentry will show:

```
Span: gemini-direct-generation
├─ Duration: 1.2s
├─ Model: gemini-2.5-flash
├─ Input: "Explain quantum computing in simple terms"
├─ Output: "Quantum computing uses quantum mechanics to process..."
├─ Tokens Used: { prompt: 10, completion: 50, total: 60 }
└─ Status: success
```

## 🎯 Function IDs Reference

| Function ID                      | Purpose                        | Location                     |
| -------------------------------- | ------------------------------ | ---------------------------- |
| `gemini-direct-generation`       | Standard text generation       | /api/demo/blocking           |
| `gemini-web-search-analysis`     | Analysis with web scraping     | /api/demo/blocking           |
| `groq-text-generation`           | Groq AI text generation        | /api/groq/blocking           |
| `gemini-scrape-analysis`         | Gemini analyze scraped content | /api/scrape-analyze/blocking |
| `groq-scrape-analysis`           | Groq analyze scraped content   | /api/scrape-analyze/blocking |
| `inngest-gemini-background`      | Background Gemini job          | inngest/functions.ts         |
| `inngest-groq-background`        | Background Groq job            | inngest/functions.ts         |
| `inngest-gemini-scrape-analysis` | Background Gemini analysis     | inngest/functions.ts         |
| `inngest-groq-scrape-analysis`   | Background Groq analysis       | inngest/functions.ts         |

## 🔧 Customization

### Disable Telemetry for Specific Calls

```typescript
const result = await generateText({
  model: google("gemini-2.5-flash"),
  prompt: "...",
  experimental_telemetry: {
    isEnabled: false, // Disable for this call
  },
});
```

### Change Recording Settings

```typescript
experimental_telemetry: {
  isEnabled: true,
  functionId: "custom-function-id",
  recordInputs: false,  // Don't record prompts
  recordOutputs: true,  // Only record responses
}
```

## 📚 Integration with Error Tracking

The AI SDK integration works seamlessly with your existing error tracking:

- **API errors** → Tracked via `trackAPIError()`
- **External service errors** → Tracked via `trackExternalServiceError()`
- **AI call performance** → Tracked via Vercel AI SDK telemetry
- **Inngest errors** → Tracked via Sentry middleware

All of these appear in the same Sentry dashboard with proper correlation!

## 🎨 Benefits

1. ✅ **Complete Visibility** - See every AI call in your application
2. ✅ **Performance Optimization** - Identify slow AI calls
3. ✅ **Cost Tracking** - Monitor token usage across all models
4. ✅ **Debugging** - View exact inputs/outputs for troubleshooting
5. ✅ **Model Comparison** - Compare Gemini vs Groq performance
6. ✅ **No Code Changes Required** - Works with existing error tracking

## 🔗 Quick Links

- **Sentry Performance Dashboard:** https://sentry.io/organizations/richard-ramos-jr/performance/
- **Sentry Issues:** https://sentry.io/organizations/richard-ramos-jr/issues/
- **AI SDK Docs:** https://sdk.vercel.ai/docs
- **Sentry AI SDK Integration Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/vercel-ai/

---

**Status:** ✅ Fully Implemented and Ready to Use!

All AI model calls are now automatically instrumented with Sentry telemetry! 🎉
