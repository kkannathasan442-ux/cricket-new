"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Foundation hook for error reporting (wire to Sentry/Logtail later).
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <Container className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-3xl font-black neon-text">Something broke</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            An unexpected error occurred. You can try again.
          </p>
          <Button variant="neon" onClick={reset}>
            Try again
          </Button>
        </Container>
      </body>
    </html>
  );
}
