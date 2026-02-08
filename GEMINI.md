# Project Overview

This is a Next.js project bootstrapped with `create-next-app`, serving as an "AI-powered code editor." The application is built with React and TypeScript, focusing on intelligent completions, refactoring tools, and real-time collaboration.

Key technologies and features include:

*   **Frontend Framework:** Next.js (with React and TypeScript)
*   **Styling:** Tailwind CSS, utilizing `shadcn/ui` for UI components.
*   **AI Integration:** Utilizes `@ai-sdk/google` and `@ai-sdk/groq` for AI model interactions, and integrates `Sentry.vercelAIIntegration()` for monitoring Vercel AI SDK usage.
*   **Error Tracking:** Sentry for comprehensive error monitoring on both client and server sides, including source map uploads and Vercel Cron Monitors.
*   **Backend Services:** Integration with Supabase for backend-as-a-service functionalities and `ioredis` for Redis interactions.
*   **Event-Driven Functions:** `inngest` for handling event-driven serverless functions.
*   **State Management:** `zustand` for client-side state management.
*   **Code Editor:** Uses CodeMirror for the core editor functionality.

## Building and Running

To get started with the project, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    # or yarn install
    # or pnpm install
    # or bun install
    ```

2.  **Run Development Server:**
    ```bash
    npm run dev
    # or yarn dev
    # or pnpm dev
    # or bun dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The page auto-updates as you edit files.

3.  **Build for Production:**
    ```bash
    npm run build
    ```

4.  **Start Production Server:**
    ```bash
    npm run start
    ```

5.  **Linting:**
    ```bash
    npm run lint
    ```

## Development Conventions

*   **Language:** TypeScript is used throughout the project, with `tsconfig.json` configured for Next.js and React.
*   **Code Style & Quality:** ESLint is configured using `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` to enforce consistent code style and identify potential issues.
*   **UI Components:** `shadcn/ui` is used for a consistent and accessible component library, configured via `components.json` with the "new-york" style.
*   **Styling:** Tailwind CSS is the primary styling framework, integrated with PostCSS. Utility functions like `cn` (combining `clsx` and `tailwind-merge`) are used for managing dynamic class names.
*   **Error Reporting:** Sentry is actively used for error tracking, ensuring robust monitoring of application health.
*   **Path Aliases:** The project uses path aliases (e.g., `@/components`, `@/lib/utils`) for cleaner imports, as defined in `tsconfig.json` and `components.json`.
*   **Fonts:** Custom fonts (`Geist`, `Geist_Mono`) are managed via `next/font/google`.
