/**
 * Example: Using Sentry Logging and Breadcrumbs in Your App
 *
 * This file demonstrates all the new structured logging and user context features
 */

"use client";

import React from "react";
import {
  useSentryBreadcrumbs,
  useTrackedAPI,
} from "@/hooks/use-sentry-breadcrumbs";
import {
  captureInfo,
  captureWarning,
  captureDebug,
  setUserContext,
} from "@/lib/sentry-logging";

export default function SentryLoggingDemo() {
  const { trackClick, trackFormSubmit, trackBreadcrumb } =
    useSentryBreadcrumbs();
  const { trackedFetch } = useTrackedAPI();

  // Example 1: Track button clicks
  const handleButtonClick = () => {
    trackClick("demo_button", {
      buttonId: "example-button",
      timestamp: Date.now(),
    });

    captureInfo("User clicked demo button", {
      tags: { feature: "demo", action: "button_click" },
      extra: { buttonId: "example-button" },
    });
  };

  // Example 2: Track form submissions
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackFormSubmit("demo_form", {
      fields: ["name", "email"],
      submittedAt: new Date().toISOString(),
    });

    captureInfo("User submitted demo form", {
      tags: { feature: "demo", action: "form_submit" },
    });
  };

  // Example 3: Track API calls with automatic breadcrumbs
  const handleAPICall = async () => {
    try {
      const response = await trackedFetch("/api/demo/blocking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Hello! This is a test from the Sentry logging demo.",
          useWebSearch: false,
        }),
      });

      if (response.ok) {
        captureInfo("API call successful", {
          tags: { api: "demo", status: "success" },
          extra: { statusCode: response.status },
        });
      }
    } catch (error) {
      captureWarning("API call failed", {
        tags: { api: "demo", status: "error" },
        extra: { error: error instanceof Error ? error.message : "Unknown" },
      });
    }
  };

  // Example 4: Custom breadcrumbs for specific events
  const handleCustomEvent = () => {
    trackBreadcrumb({
      category: "video",
      message: "User played demo video",
      level: "info",
      data: {
        videoId: "demo-123",
        duration: 120,
        timestamp: Date.now(),
      },
    });
  };

  // Example 5: Debug logging (only shows in dev)
  const handleDebugLog = () => {
    captureDebug("Debug: User triggered test action", {
      extra: {
        componentState: { mounted: true, clicks: 5 },
        environment: process.env.NODE_ENV,
      },
    });
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        Sentry Logging & Breadcrumbs Demo
      </h1>

      <div className="space-y-6">
        {/* Example 1 */}
        <section className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">1. Track Button Clicks</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Logs button clicks as breadcrumbs and structured info messages
          </p>
          <button
            onClick={handleButtonClick}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Click to Track
          </button>
        </section>

        {/* Example 2 */}
        <section className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">
            2. Track Form Submissions
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tracks form submissions with field information
          </p>
          <form onSubmit={handleFormSubmit} className="space-y-2">
            <input
              type="text"
              placeholder="Name"
              className="border px-3 py-2 rounded w-full"
            />
            <input
              type="email"
              placeholder="Email"
              className="border px-3 py-2 rounded w-full"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Submit Form
            </button>
          </form>
        </section>

        {/* Example 3 */}
        <section className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">3. Tracked API Calls</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Automatically tracks API calls as breadcrumbs with timing
          </p>
          <button
            onClick={handleAPICall}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Make API Call
          </button>
        </section>

        {/* Example 4 */}
        <section className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">4. Custom Breadcrumbs</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add custom breadcrumbs for specific events (video play, downloads,
            etc.)
          </p>
          <button
            onClick={handleCustomEvent}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Trigger Custom Event
          </button>
        </section>

        {/* Example 5 */}
        <section className="border p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">5. Debug Logging</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Low-priority logs for development debugging
          </p>
          <button
            onClick={handleDebugLog}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Log Debug Info
          </button>
        </section>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">📊 What Gets Tracked:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>Breadcrumbs:</strong> Trail of user actions leading to
              errors
            </li>
            <li>
              <strong>User Context:</strong> Automatically set when user logs in
            </li>
            <li>
              <strong>Structured Logs:</strong> Info/Warning/Debug messages with
              tags
            </li>
            <li>
              <strong>Navigation:</strong> Page transitions tracked
              automatically
            </li>
            <li>
              <strong>API Calls:</strong> HTTP requests with timing and status
            </li>
          </ul>
        </div>

        {/* View in Sentry */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">🔍 View in Sentry:</h3>
          <p className="text-sm mb-2">
            After triggering events above, check your Sentry dashboard:
          </p>
          <a
            href="https://sentry.io/organizations/richard-ramos-jr/issues/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Open Sentry Dashboard →
          </a>
          <p className="text-xs text-muted-foreground mt-2">
            Look for breadcrumbs in the event details page
          </p>
        </div>
      </div>
    </div>
  );
}
