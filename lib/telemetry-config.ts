/**
 * Telemetry Configuration Helper
 *
 * Creates consistent telemetry config for Vercel AI SDK calls.
 * In production, disables recordInputs and recordOutputs to prevent
 * capturing sensitive data (user prompts, scraped content, etc.)
 */

export function createTelemetryConfig(functionId: string) {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    isEnabled: true,
    functionId,
    // Only record inputs/outputs in non-production environments
    // to avoid capturing sensitive user data or scraped content
    recordInputs: !isProduction,
    recordOutputs: !isProduction,
  };
}
