"use client";

import { ErrorState } from "@/components/common/error-state";

export default function ErrorMatches({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-10">
      <ErrorState
        title="Failed to load matches"
        message={error.message ?? "An unexpected error occurred."}
        onRetry={reset}
      />
    </div>
  );
}
