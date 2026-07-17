import { NextResponse } from "next/server";

import { startMatch } from "@/features/scoring/playing-xi";
import { getMatchScoringContext } from "@/features/scoring/service";
import type { MatchStartConfig } from "@/features/scoring";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * POST /api/match/[id]/start
 * Applies the Match Start Wizard (toss, Playing XI, openers).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: matchId } = await params;
  if (!isUuid(matchId)) {
    return NextResponse.json({ error: "Invalid match id." }, { status: 400 });
  }

  let body: Partial<MatchStartConfig> & { teamAId?: string; teamBId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const required = [
    body.tossWinnerId,
    body.tossDecision,
    body.teamAPlayers,
    body.teamBPlayers,
    body.openingBatsmen,
    body.openingBowlerId,
    body.teamAId,
    body.teamBId,
  ];
  if (required.some((v) => v === undefined || v === null)) {
    return NextResponse.json(
      { error: "Missing match start fields." },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(body.teamAPlayers) ||
    body.teamAPlayers.length < 1 ||
    !Array.isArray(body.teamBPlayers) ||
    body.teamBPlayers.length < 1
  ) {
    return NextResponse.json(
      { error: "Each team needs at least one Playing XI player." },
      { status: 400 },
    );
  }

  try {
    const config: MatchStartConfig = {
      tossWinnerId: body.tossWinnerId as string,
      tossDecision: body.tossDecision as "bat" | "bowl",
      teamAPlayers: body.teamAPlayers as string[],
      teamBPlayers: body.teamBPlayers as string[],
      openingBatsmen: body.openingBatsmen as MatchStartConfig["openingBatsmen"],
      openingBowlerId: body.openingBowlerId as string,
    };
    await startMatch(
      matchId,
      body.teamAId as string,
      body.teamBId as string,
      config,
    );
    const context = await getMatchScoringContext(matchId);
    return NextResponse.json({ ok: true, context });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start match.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
