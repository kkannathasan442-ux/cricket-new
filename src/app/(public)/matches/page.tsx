import { LiveMatchesGrid } from "@/features/matches/components/live-matches-grid";

import { PageShell } from "@/components/common/page-shell";

export default function MatchesPage() {
  return (
    <PageShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-black tracking-tight">Live Matches</h1>
        <LiveMatchesGrid />
      </div>
    </PageShell>
  );
}
