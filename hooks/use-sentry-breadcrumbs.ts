/**
 * Sentry Breadcrumbs Hook
 *
 * A React hook that automatically tracks user interactions and navigation
 * as breadcrumbs in Sentry. This helps debug issues by providing a trail
 * of what the user did before an error occurred.
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  trackUserAction,
  trackNavigation,
  trackAPICall,
  addBreadcrumb,
} from "@/lib/sentry-logging";

export function useSentryBreadcrumbs() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  // Track navigation changes
  useEffect(() => {
    if (prevPathRef.current && pathname) {
      trackNavigation(prevPathRef.current, pathname);
    }
    prevPathRef.current = pathname ?? null;
  }, [pathname]);

  // Return helper functions for manual tracking
  return {
    /**
     * Track a button click or user action
     *
     * @example
     * const { trackClick } = useSentryBreadcrumbs();
     * <button onClick={() => trackClick("submit_form", { formId: "contact" })}>
     */
    trackClick: useCallback((action: string, data?: Record<string, any>) => {
      trackUserAction("click", action, data);
    }, []),

    /**
     * Track an API call
     *
     * @example
     * const { trackAPI } = useSentryBreadcrumbs();
     * trackAPI("POST", "/api/users", 201, { userId: "123" });
     */
    trackAPI: useCallback(
      (
        method: string,
        endpoint: string,
        statusCode: number,
        data?: Record<string, any>,
      ) => {
        trackAPICall(method, endpoint, statusCode, data);
      },
      [],
    ),

    /**
     * Track a form submission
     *
     * @example
     * const { trackFormSubmit } = useSentryBreadcrumbs();
     * trackFormSubmit("contact_form", { fields: ["name", "email"] });
     */
    trackFormSubmit: useCallback(
      (formId: string, data?: Record<string, any>) => {
        trackUserAction("submit", `Form: ${formId}`, data);
      },
      [],
    ),

    /**
     * Track a custom breadcrumb
     *
     * @example
     * const { trackBreadcrumb } = useSentryBreadcrumbs();
     * trackBreadcrumb({ category: "video", message: "User played video", data: { videoId: "123" } });
     */
    trackBreadcrumb: useCallback(
      (breadcrumb: {
        message: string;
        category?: string;
        level?: "debug" | "info" | "warning" | "error";
        data?: Record<string, any>;
      }) => {
        addBreadcrumb(breadcrumb);
      },
      [],
    ),
  };
}

/**
 * Hook to automatically track API calls from React components
 * Wraps fetch/axios calls with breadcrumb tracking
 *
 * @example
 * const { trackedFetch } = useTrackedAPI();
 * const response = await trackedFetch("/api/users", { method: "POST" });
 */
export function useTrackedAPI() {
  const trackAPI = useCallback(
    (
      method: string,
      endpoint: string,
      statusCode: number,
      data?: Record<string, any>,
    ) => {
      trackAPICall(method, endpoint, statusCode, data);
    },
    [],
  );

  /**
   * Wrapped fetch that automatically tracks API calls
   */
  const trackedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const method = init?.method || "GET";
      const startTime = Date.now();

      try {
        const response = await fetch(url, init);
        const duration = Date.now() - startTime;

        trackAPI(method, url, response.status, {
          duration,
          ok: response.ok,
        });

        return response;
      } catch (error) {
        trackAPI(method, url, 0, {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    },
    [trackAPI],
  );

  return {
    trackedFetch,
    trackAPI,
  };
}
