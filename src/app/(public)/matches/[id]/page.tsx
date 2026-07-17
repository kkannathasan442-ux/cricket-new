import Link from "next/link";

import { PageShell } from "@/components/common";
import { getMatchCenterData } from "@/features/matches/service";
import { PublicMatchCenter } from "@/features/matches/components/public-match-center";

export const dynamic = "force-dynamic";

export default async function PublicMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getMatchCenterData(id);

  if (!data) {
    return (
      <PageShell>
        <div className="text-center">
          <h1 className="text-xl font-bold">Match not found</h1>
          <Link href="/matches" className="mt-2 inline-block text-primary hover:underline">
            ← Back to matches
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/matches" className="text-sm text-primary hover:underline">
            ← Matches
          </Link>
        </div>
        <header>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {data.tournamentName ?? "Tournament"}
          </p>
          <h1 className="text-2xl font-black tracking-tight">
            {data.teamA.name}{" "}
            <span className="text-muted-foreground">vs</span>{" "}
            {data.teamB.name}
          </h1>
        </header>
        <PublicMatchCenter matchId={id} data={data} />
      </div>
    </PageShell>
  );
}
