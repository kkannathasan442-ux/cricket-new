import { NextResponse } from "next/server";

import { getMatchScoringContext } from "@/features/scoring/service";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/** Lightweight public snapshot used by the realtime scoreboard refetch. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid match id." }, { status: 400 });
  }

  const context = await getMatchScoringContext(id);
  if (!context) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  return NextResponse.json({
    battingTeam: context.battingTeam?.teamName ?? null,
    bowlingTeam: context.bowlingTeam?.teamName ?? null,
    totalRuns: context.innings?.total_runs ?? 0,
    totalWickets: context.innings?.total_wickets ?? 0,
    ballsBowled: context.innings?.balls_bowled ?? 0,
    target: context.innings?.target ?? null,
    inningsNumber: context.innings?.innings_number ?? null,
    striker: context.striker?.playerName ?? null,
    bowler: context.bowler?.playerName ?? null,
    recentBalls: context.recentBalls.map((b) => ({
      id: b.id,
      runs: b.runs,
      extras: b.extras,
      extras_type: b.extras_type,
      is_wicket: b.is_wicket,
      over_number: b.over_number,
      ball_number: b.ball_number,
    })),
  });
}
