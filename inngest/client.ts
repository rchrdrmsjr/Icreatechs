import { Inngest } from "inngest";
import { sentryMiddleware } from "@inngest/middleware-sentry";

// Create a client to send and receive events with Sentry middleware
// This enables:
// - Automatic exception capture for all Inngest functions
// - Performance tracing for each function run
// - Contextual data like function ID and event names in Sentry
export const inngest = new Inngest({
  id: "icreatechs",
  middleware: [sentryMiddleware()],
});
