# Error Tracking System 🔍

Complete error tracking implementation for client errors, API errors, and background job errors.

## Overview

This application uses Sentry for comprehensive error tracking across:

- **Client-side errors** - React components, browser events, user interactions
- **API errors** - Next.js API routes, server-side errors
- **Background job errors** - Inngest function failures

## 📁 Key Files

### Core Utilities

- **[lib/error-tracking.ts](../lib/error-tracking.ts)** - Centralized error tracking utilities
- **[components/error-boundary.tsx](../components/error-boundary.tsx)** - React Error Boundary component

### Configuration

- **[inngest/client.ts](../inngest/client.ts)** - Inngest with Sentry middleware
- **sentry.server.config.ts** - Server-side Sentry config
- **instrumentation-client.ts** - Client-side Sentry config

### Demo & Testing

- **[app/error-tracking-demo/page.tsx](../app/error-tracking-demo/page.tsx)** - Live demo of all error types

## 🚀 Quick Start

### 1. Client-Side Error Tracking

#### Using Error Boundary (Recommended)

```tsx
import { ErrorBoundary } from "@/components/error-boundary";

export default function MyPage() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### Manual Error Tracking

```tsx
import { useErrorTracking } from "@/components/error-boundary";

function MyComponent() {
  const { reportError } = useErrorTracking();

  const handleAction = async () => {
    try {
      // Your code
    } catch (error) {
      reportError(error, {
        component: "MyComponent",
        action: "user_action",
        metadata: { userId: "123" },
      });
    }
  };
}
```

#### Direct Tracking

```typescript
import { trackClientError } from "@/lib/error-tracking";

try {
  // Your code
} catch (error) {
  trackClientError(error, {
    component: "ComponentName",
    action: "what_happened",
    metadata: { additionalInfo: "..." },
  });
}
```

### 2. API Error Tracking

#### With Performance Tracking

```typescript
import { trackAPIError, trackPerformance } from "@/lib/error-tracking";

export async function POST(request: NextRequest) {
  return trackPerformance(
    "http.server",
    "POST /api/your-endpoint",
    async () => {
      try {
        // Your API logic
      } catch (error) {
        trackAPIError(error, {
          endpoint: "/api/your-endpoint",
          method: "POST",
          statusCode: 500,
          metadata: { requestId: "..." },
        });
        throw error;
      }
    },
  );
}
```

#### Validation Errors

```typescript
import { trackValidationError } from "@/lib/error-tracking";

if (!email || typeof email !== "string") {
  trackValidationError("email", email, {
    endpoint: "/api/register",
    expectedType: "string",
  });
  return NextResponse.json({ error: "Invalid email" }, { status: 400 });
}
```

#### External Service Errors

```typescript
import { trackExternalServiceError } from "@/lib/error-tracking";

try {
  const result = await groq.generateText(...);
} catch (error) {
  trackExternalServiceError("groq", error, {
    operation: "generateText",
    statusCode: response?.status,
    metadata: { model: "llama-3.3-70b" },
  });
}
```

### 3. Background Job Error Tracking

Background job errors are **automatically tracked** via Sentry middleware!

#### Inngest Functions (Automatic)

```typescript
// inngest/functions.ts
export const myFunction = inngest.createFunction(
  { id: "my-function" },
  { event: "my/event" },
  async ({ event, step }) => {
    // Any errors here are automatically captured by Sentry
    // No additional code needed!
  },
);
```

#### Manual Tracking (Optional)

```typescript
import { trackInngestError } from "@/lib/error-tracking";

export const myFunction = inngest.createFunction(
  { id: "my-function" },
  { event: "my/event" },
  async ({ event, step }) => {
    try {
      // Your code
    } catch (error) {
      trackInngestError(error, {
        functionId: "my-function",
        eventName: "my/event",
        requestId: event.data.requestId,
        step: "step-name",
      });
      throw error; // Re-throw for Inngest to handle
    }
  },
);
```

## 📊 Error Types & Tags

All errors are tagged in Sentry for easy filtering:

| Error Type       | Tag                                  | Description               |
| ---------------- | ------------------------------------ | ------------------------- |
| Client           | `error_type: client_error`           | Browser/React errors      |
| API              | `error_type: api_error`              | API route errors          |
| Validation       | `error_type: validation_error`       | Input validation failures |
| External Service | `error_type: external_service_error` | Third-party API failures  |
| Inngest          | `error_type: inngest_error`          | Background job errors     |

## 🎯 Best Practices

### 1. Always Provide Context

```typescript
// ❌ Bad
trackClientError(error, {});

// ✅ Good
trackClientError(error, {
  component: "UserProfile",
  action: "update_profile",
  metadata: {
    userId: user.id,
    fields: ["name", "email"],
  },
});
```

### 2. Use Appropriate Error Tracking Functions

```typescript
// Client-side
trackClientError(error, { component: "MyComponent" });

// API route
trackAPIError(error, { endpoint: "/api/...", method: "POST" });

// External service (Groq, Firecrawl, etc.)
trackExternalServiceError("groq", error, { operation: "generateText" });

// Background job (usually automatic)
trackInngestError(error, { functionId: "my-func", eventName: "my/event" });
```

### 3. Wrap Important Components with ErrorBoundary

```tsx
// Layout or important pages
<ErrorBoundary fallback={<CustomErrorUI />}>
  <CriticalComponent />
</ErrorBoundary>
```

### 4. Use Performance Tracking for Critical Paths

```typescript
return trackPerformance(
  "http.server",
  "POST /api/critical-endpoint",
  async () => {
    // Your code - timing automatically tracked
  },
);
```

## 🧪 Testing Error Tracking

Visit the demo page to test all error types:

```
http://localhost:3000/error-tracking-demo
```

The demo page includes:

1. ✅ Client-side error trigger
2. ✅ API error trigger
3. ✅ Background job error trigger
4. ✅ React component error trigger

## 📈 Monitoring

### View Errors in Sentry

1. Go to: https://sentry.io/organizations/richard-ramos-jr/issues/
2. Filter by tags:
   - `error_type:client_error`
   - `error_type:api_error`
   - `error_type:inngest_error`
   - `endpoint:/api/...`
   - `component:ComponentName`

### Performance Monitoring

1. Go to Sentry Performance dashboard
2. View traces for all API endpoints
3. See timing breakdown for each request

### Background Jobs

1. Inngest Dashboard: http://localhost:8288 (dev)
2. Sentry Issues: Filter by `error_type:inngest_error`

## 📝 Updated API Routes

The following routes now have comprehensive error tracking:

- ✅ [app/api/demo/blocking/route.ts](../app/api/demo/blocking/route.ts)
- ✅ [app/api/groq/blocking/route.ts](../app/api/groq/blocking/route.ts)
- ✅ [app/api/scrape-analyze/blocking/route.ts](../app/api/scrape-analyze/blocking/route.ts)

All routes include:

- Performance span tracking
- Error categorization (API vs external service)
- Validation error tracking
- Rich context and metadata

## 🔧 Utility Functions

### Available Functions from `lib/error-tracking.ts`

```typescript
// Error tracking
trackAPIError(error, context);
trackClientError(error, context);
trackInngestError(error, context);
trackValidationError(field, value, context);
trackExternalServiceError(serviceName, error, context);

// Performance
trackPerformance(operation, name, callback);

// Logging
const { logger } = Sentry;
logger.info(message, context);
logger.error(message, context);
```

## 🎨 Custom Error UI

Customize the Error Boundary fallback:

```tsx
<ErrorBoundary
  fallback={
    <div className="custom-error-ui">
      <h1>Oops! Something went wrong</h1>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  }
>
  <YourComponent />
</ErrorBoundary>
```

## 🚨 Important Notes

1. **Inngest errors are automatic** - The Sentry middleware handles everything
2. **All API routes should use `trackPerformance`** - Provides both error tracking and performance insights
3. **Wrap user-facing components with ErrorBoundary** - Prevents white screen of death
4. **Always include context** - Helps with debugging in production
5. **External service errors** - Use `trackExternalServiceError` for third-party APIs

## 📚 Examples

See working examples in:

- [error-tracking-demo/page.tsx](../app/error-tracking-demo/page.tsx) - All error types
- [api/groq/blocking/route.ts](../app/api/groq/blocking/route.ts) - API error tracking
- [api/demo/blocking/route.ts](../app/api/demo/blocking/route.ts) - Performance + errors
- [inngest/functions.ts](../inngest/functions.ts) - Background job errors (automatic)

---

**Status:** ✅ Fully Implemented and Ready to Use!
