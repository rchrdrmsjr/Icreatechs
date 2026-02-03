"use client";

import { useState } from "react";
import { ErrorBoundary, useErrorTracking } from "@/components/error-boundary";
import { trackClientError } from "@/lib/error-tracking";

/**
 * Error Tracking Demo Page
 *
 * This page demonstrates all three types of error tracking:
 * 1. Client-side errors (React components, browser events)
 * 2. API errors (backend errors from API routes)
 * 3. Background job errors (Inngest function failures)
 */

function ErrorTrackingContent() {
  const [apiResponse, setApiResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { reportError } = useErrorTracking();

  // Test 1: Client-side error
  const triggerClientError = () => {
    try {
      // Intentionally cause an error
      throw new Error("Test client-side error triggered by user");
    } catch (error) {
      trackClientError(error, {
        component: "ErrorTrackingDemo",
        action: "button_click",
        metadata: {
          testType: "client_error",
          timestamp: new Date().toISOString(),
        },
      });
      setApiResponse("✅ Client error tracked! Check Sentry dashboard.");
    }
  };

  // Test 2: API error
  const triggerAPIError = async () => {
    setLoading(true);
    setApiResponse("");

    try {
      const response = await fetch("/api/demo/blocking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Invalid prompt to trigger validation error
          prompt: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiResponse(`❌ API Error: ${data.error || "Unknown error"}`);
      } else {
        setApiResponse("✅ API call successful!");
      }
    } catch (error) {
      reportError(error, {
        component: "ErrorTrackingDemo",
        action: "api_call",
        metadata: { endpoint: "/api/demo/blocking" },
      });
      setApiResponse(
        `❌ Network Error: ${error instanceof Error ? error.message : "Unknown"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Inngest background job error
  const triggerInngestError = async () => {
    setLoading(true);
    setApiResponse("");

    try {
      const response = await fetch("/api/demo/non-blocking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Invalid data to potentially trigger Inngest error
          prompt: "Test prompt that will cause an issue",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setApiResponse(
          `✅ Background job queued! Request ID: ${data.requestId}\n` +
            `Check Inngest dashboard and Sentry for any errors.`,
        );
      } else {
        setApiResponse(`❌ Failed to queue job: ${data.error}`);
      }
    } catch (error) {
      reportError(error, {
        component: "ErrorTrackingDemo",
        action: "inngest_queue",
      });
      setApiResponse(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Test 4: React component error (caught by Error Boundary)
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("Test React component error caught by ErrorBoundary");
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Error Tracking Demo</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          📊 Monitoring Active
        </h2>
        <p className="text-blue-800">
          All errors are being tracked and sent to Sentry. Check your{" "}
          <a
            href="https://sentry.io/organizations/richard-ramos-jr/issues/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            Sentry Dashboard
          </a>{" "}
          to see the errors.
        </p>
      </div>

      <div className="space-y-6">
        {/* Test 1: Client Error */}
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">1. Client-Side Error</h3>
          <p className="text-gray-600 mb-4">
            Triggers a JavaScript error in the browser that gets tracked by
            Sentry.
          </p>
          <button
            onClick={triggerClientError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Trigger Client Error
          </button>
        </div>

        {/* Test 2: API Error */}
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">2. API Error</h3>
          <p className="text-gray-600 mb-4">
            Sends an invalid request to the API, triggering server-side error
            tracking.
          </p>
          <button
            onClick={triggerAPIError}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Trigger API Error"}
          </button>
        </div>

        {/* Test 3: Inngest Error */}
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">
            3. Background Job Error
          </h3>
          <p className="text-gray-600 mb-4">
            Queues an Inngest background job. Errors in the job are tracked
            automatically.
          </p>
          <button
            onClick={triggerInngestError}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Trigger Inngest Job"}
          </button>
        </div>

        {/* Test 4: React Component Error */}
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3">
            4. React Component Error
          </h3>
          <p className="text-gray-600 mb-4">
            Throws an error during component rendering, caught by Error
            Boundary.
          </p>
          <button
            onClick={() => setShouldThrow(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Trigger Component Error
          </button>
        </div>

        {/* Response Display */}
        {apiResponse && (
          <div className="border rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-semibold mb-2">Response:</h3>
            <pre className="whitespace-pre-wrap text-sm">{apiResponse}</pre>
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Error Tracking Types:</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="text-red-600 mr-2">🔴</span>
            <div>
              <strong>Client Errors:</strong> JavaScript errors in the browser
              (tracked via trackClientError and ErrorBoundary)
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">🟠</span>
            <div>
              <strong>API Errors:</strong> Server-side errors in API routes
              (tracked via trackAPIError and performance spans)
            </div>
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">🟣</span>
            <div>
              <strong>Background Job Errors:</strong> Errors in Inngest
              functions (tracked automatically via Sentry middleware)
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function ErrorTrackingDemoPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Error Boundary Caught an Error!
            </h2>
            <p className="text-gray-600 mb-4">
              This error was caught by the ErrorBoundary component and reported
              to Sentry.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      <ErrorTrackingContent />
    </ErrorBoundary>
  );
}
