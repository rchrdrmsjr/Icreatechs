/**
 * Structured Logging Utilities for Sentry
 *
 * These utilities help send structured logs to Sentry with proper severity levels,
 * tags, and context. This is useful for tracking user interactions, business logic
 * events, and debugging information without triggering error alerts.
 */

import * as Sentry from "@sentry/nextjs";

export type LogLevel = "debug" | "info" | "warning" | "error";

interface LogContext {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
}

/**
 * Capture a structured log message in Sentry
 *
 * @example
 * captureLog("info", "User completed checkout", {
 *   tags: { flow: "checkout", step: "payment" },
 *   extra: { orderId: "12345", amount: 99.99 }
 * });
 */
export function captureLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
) {
  const scope = new Sentry.Scope();

  // Add tags for filtering in Sentry
  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      scope.setTag(key, value);
    });
  }

  // Add extra context data
  if (context?.extra) {
    Object.entries(context.extra).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
  }

  // Add user context if provided
  if (context?.user) {
    scope.setUser(context.user);
  }

  // Capture the message with appropriate level
  Sentry.captureMessage(message, {
    level,
    captureContext: scope,
  });
}

/**
 * Log debug information (low priority, for development)
 *
 * @example
 * captureDebug("Cache miss for user preferences", {
 *   extra: { userId: "123", cacheKey: "user_prefs_123" }
 * });
 */
export function captureDebug(message: string, context?: LogContext) {
  captureLog("debug", message, context);
}

/**
 * Log informational events (normal operations worth tracking)
 *
 * @example
 * captureInfo("User created new project", {
 *   tags: { action: "create_project" },
 *   extra: { projectName: "My App", templateUsed: "nextjs" }
 * });
 */
export function captureInfo(message: string, context?: LogContext) {
  captureLog("info", message, context);
}

/**
 * Log warning events (potential issues, but not errors)
 *
 * @example
 * captureWarning("API rate limit approaching", {
 *   tags: { service: "openai" },
 *   extra: { currentUsage: 9500, limit: 10000 }
 * });
 */
export function captureWarning(message: string, context?: LogContext) {
  captureLog("warning", message, context);
}

/**
 * Add a breadcrumb to track user actions
 * Breadcrumbs create a trail of events leading up to an error
 *
 * @example
 * addBreadcrumb({
 *   category: "navigation",
 *   message: "User navigated to dashboard",
 *   level: "info",
 *   data: { from: "/home", to: "/dashboard" }
 * });
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: "debug" | "info" | "warning" | "error";
  data?: Record<string, any>;
}) {
  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || "custom",
    level: breadcrumb.level || "info",
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track a user action as a breadcrumb
 *
 * @example
 * trackUserAction("button_click", "Submit form", { formId: "contact" });
 */
export function trackUserAction(
  action: string,
  description: string,
  data?: Record<string, any>,
) {
  addBreadcrumb({
    category: "user.action",
    message: `${action}: ${description}`,
    level: "info",
    data: { action, ...data },
  });
}

/**
 * Track an API call as a breadcrumb
 *
 * @example
 * trackAPICall("POST", "/api/users", 201, { userId: "123" });
 */
export function trackAPICall(
  method: string,
  endpoint: string,
  statusCode: number,
  data?: Record<string, any>,
) {
  addBreadcrumb({
    category: "api.call",
    message: `${method} ${endpoint} - ${statusCode}`,
    level: statusCode >= 400 ? "error" : "info",
    data: {
      method,
      endpoint,
      statusCode,
      ...data,
    },
  });
}

/**
 * Track a navigation event
 *
 * @example
 * trackNavigation("/dashboard", "/settings");
 */
export function trackNavigation(from: string, to: string) {
  addBreadcrumb({
    category: "navigation",
    message: `Navigated from ${from} to ${to}`,
    level: "info",
    data: { from, to },
  });
}

/**
 * Set user context for all subsequent events
 * Call this when user logs in or when user data is available
 *
 * @example
 * setUserContext({
 *   id: "user_123",
 *   email: "user@example.com",
 *   username: "johndoe"
 * });
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    ...user,
  });
}

/**
 * Clear user context (call on logout)
 *
 * @example
 * clearUserContext();
 */
export function clearUserContext() {
  Sentry.setUser(null);
}
