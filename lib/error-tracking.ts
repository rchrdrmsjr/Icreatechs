/**
 * Centralized Error Tracking Utilities
 *
 * This module provides consistent error tracking across:
 * - Client-side errors (React components, browser events)
 * - API errors (Next.js API routes)
 * - Background job errors (Inngest functions)
 */

import * as Sentry from "@sentry/nextjs";

// Error severity levels
export type ErrorSeverity = "fatal" | "error" | "warning" | "info" | "debug";

// Error context types
export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Track API errors with context
 */
export function trackAPIError(
  error: unknown,
  context: {
    endpoint: string;
    method: string;
    statusCode?: number;
    requestId?: string;
    metadata?: Record<string, any>;
  },
) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  Sentry.captureException(error, {
    tags: {
      error_type: "api_error",
      endpoint: context.endpoint,
      method: context.method,
      status_code: context.statusCode?.toString(),
    },
    contexts: {
      api: {
        endpoint: context.endpoint,
        method: context.method,
        status_code: context.statusCode,
        request_id: context.requestId,
      },
    },
    extra: {
      metadata: context.metadata,
      error_message: errorMessage,
    },
  });

  // Also log to console for development
  console.error(`[API Error] ${context.method} ${context.endpoint}:`, error);
}

/**
 * Track client-side errors with context
 */
export function trackClientError(
  error: unknown,
  context: {
    component?: string;
    action?: string;
    metadata?: Record<string, any>;
  },
) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  Sentry.captureException(error, {
    tags: {
      error_type: "client_error",
      component: context.component,
      action: context.action,
    },
    extra: {
      metadata: context.metadata,
      error_message: errorMessage,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    },
  });

  console.error(`[Client Error] ${context.component || "Unknown"}:`, error);
}

/**
 * Track Inngest function errors with context
 */
export function trackInngestError(
  error: unknown,
  context: {
    functionId: string;
    eventName: string;
    requestId?: string;
    step?: string;
    metadata?: Record<string, any>;
  },
) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  Sentry.captureException(error, {
    tags: {
      error_type: "inngest_error",
      function_id: context.functionId,
      event_name: context.eventName,
      step: context.step,
    },
    contexts: {
      inngest: {
        function_id: context.functionId,
        event_name: context.eventName,
        request_id: context.requestId,
        step: context.step,
      },
    },
    extra: {
      metadata: context.metadata,
      error_message: errorMessage,
    },
  });

  console.error(
    `[Inngest Error] ${context.functionId} (${context.eventName}):`,
    error,
  );
}

/**
 * Track validation errors
 */
export function trackValidationError(
  field: string,
  value: any,
  context: {
    endpoint?: string;
    component?: string;
    expectedType?: string;
  },
) {
  Sentry.captureMessage(
    `Validation Error: ${field} - expected ${context.expectedType || "valid value"}`,
    {
      level: "warning",
      tags: {
        error_type: "validation_error",
        field: field,
        endpoint: context.endpoint,
        component: context.component,
      },
      extra: {
        field,
        value: (() => {
          if (typeof value !== "object" || value === null) {
            return value;
          }

          try {
            return JSON.stringify(value);
          } catch {
            return "[unserializable object]";
          }
        })(),
        expected_type: context.expectedType,
      },
    },
  );
}

/**
 * Track external service errors (AI APIs, Firecrawl, etc.)
 */
export function trackExternalServiceError(
  serviceName: string,
  error: unknown,
  context: {
    operation: string;
    statusCode?: number;
    metadata?: Record<string, any>;
  },
) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  Sentry.captureException(error, {
    tags: {
      error_type: "external_service_error",
      service: serviceName,
      operation: context.operation,
      status_code: context.statusCode?.toString(),
    },
    contexts: {
      external_service: {
        service: serviceName,
        operation: context.operation,
        status_code: context.statusCode,
      },
    },
    extra: {
      metadata: context.metadata,
      error_message: errorMessage,
    },
  });

  console.error(
    `[External Service Error] ${serviceName} - ${context.operation}:`,
    error,
  );
}

/**
 * Wrap API route handler with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  endpoint: string,
  method: string = "POST",
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      trackAPIError(error, {
        endpoint,
        method,
        statusCode: 500,
      });
      throw error;
    }
  }) as T;
}

/**
 * Log custom messages to Sentry
 */
export const { logger } = Sentry;

/**
 * Create a performance span for tracking
 */
export function trackPerformance<T>(
  operation: string,
  name: string,
  callback: (span: any) => Promise<T>,
): Promise<T> {
  return Sentry.startSpan(
    {
      op: operation,
      name: name,
    },
    callback,
  );
}
