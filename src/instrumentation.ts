/**
 * Next.js instrumentation hook (runs once when the server boots).
 *
 * Error-monitoring integration point (Phase 8). Sentry and Logtail are wired
 * conditionally so the app stays dependency-free until you opt in:
 *  - Set NEXT_PUBLIC_SENTRY_DSN (+ optional SENTRY_AUTH_TOKEN for source maps)
 *    to enable Sentry tracing.
 *  - Set LOGTAIL_SOURCE_TOKEN to forward structured logs to Logtail.
 *
 * No third-party SDK is imported here, so the build does not require those
 * packages. When you are ready, `bun add @sentry/nextjs` and call
 * `Sentry.init(...)` inside the `if (process.env.NEXT_PUBLIC_SENTRY_DSN)` block.
 */

export async function register() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Example wiring (install @sentry/nextjs first):
    // const Sentry = await import("@sentry/nextjs");
    // Sentry.init({
    //   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    //   tracesSampleRate: 0.1,
    //   environment: process.env.NODE_ENV,
    // });
    console.info("[crickpulse] Sentry DSN detected — init Sentry here.");
  }

  if (process.env.LOGTAIL_SOURCE_TOKEN) {
    console.info("[crickpulse] Logtail token detected — forward logs here.");
  }
}
