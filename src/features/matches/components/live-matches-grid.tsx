import { Activity } from "lucide-react";

import {
  EmptyState,
  ErrorState,
  Loading,
} from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";

interface LiveMatchesGridProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  /** Realtime-ready: supply matches once the data layer exists. */
  matches?: { id: string; title: string; status: string }[];
}

/**
 * Foundation placeholder for the public live matches grid.
 * Realtime subscription + data fetching are wired in later phases.
 */
export function LiveMatchesGrid({
  loading,
  error,
  onRetry,
  matches = [],
}: LiveMatchesGridProps) {
  if (loading) return <Loading label="Loading live matches…" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (matches.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No live matches right now"
        message="Matches in progress will appear here in real time."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {matches.map((match) => (
        <Card key={match.id}>
          <CardContent className="p-4">
            <p className="font-semibold">{match.title}</p>
            <p className="text-sm text-muted-foreground">{match.status}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
