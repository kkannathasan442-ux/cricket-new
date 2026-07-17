import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/admin";
import { startMatch } from "@/features/scoring/playing-xi";
import { getMatchScoringContext } from "@/features/scoring/service";
import type { MatchStartConfig } from "@/features/scoring";
import {
  validateTeamSize,
  validateOpenerInXi,
  assertPlayersInXi,
  buildXiMap,
} from "@/features/scoring/validation";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

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

  const teamAPlayers = body.teamAPlayers as string[];
  const teamBPlayers = body.teamBPlayers as string[];

  try {
    const config: MatchStartConfig = {
      tossWinnerId: body.tossWinnerId as string,
      tossDecision: body.tossDecision as "bat" | "bowl",
      teamAPlayers,
      teamBPlayers,
      openingBatsmen: body.openingBatsmen as MatchStartConfig["openingBatsmen"],
      openingBowlerId: body.openingBowlerId as string,
    };

    const context = await getMatchScoringContext(matchId);
    if (!context) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 });
    }

    const playersPerTeam = context.tournamentId
      ? (await getTournamentPlayersPerTeam(context.tournamentId)) ?? 11
      : 11;

    const elevenAErr = validateTeamSize(teamAPlayers, "Team A", playersPerTeam);
    if (elevenAErr) {
      return NextResponse.json({ error: elevenAErr }, { status: 400 });
    }
    const elevenBErr = validateTeamSize(teamBPlayers, "Team B", playersPerTeam);
    if (elevenBErr) {
      return NextResponse.json({ error: elevenBErr }, { status: 400 });
    }

    const xiMap = buildXiMap([
      ...teamAPlayers.map((pid) => ({ player_id: pid, team_id: body.teamAId as string })),
      ...teamBPlayers.map((pid) => ({ player_id: pid, team_id: body.teamBId as string })),
    ]);

    const xiA = xiMap.get(body.teamAId as string) ?? new Set<string>();
    const xiB = xiMap.get(body.teamBId as string) ?? new Set<string>();

    const battingTeamId = config.openingBatsmen.teamId;
    const bowlingTeamId =
      battingTeamId === body.teamAId ? (body.teamBId as string) : (body.teamAId as string);
    const battingXi = battingTeamId === body.teamAId ? xiA : xiB;
    const bowlingXi = bowlingTeamId === body.teamAId ? xiA : xiB;

    const strikerErr = validateOpenerInXi(
      config.openingBatsmen.strikerId,
      Array.from(battingXi),
      "Opening striker",
    );
    if (strikerErr) {
      return NextResponse.json({ error: strikerErr }, { status: 400 });
    }

    const nonStrikerErr = validateOpenerInXi(
      config.openingBatsmen.nonStrikerId,
      Array.from(battingXi),
      "Opening non-striker",
    );
    if (nonStrikerErr) {
      return NextResponse.json({ error: nonStrikerErr }, { status: 400 });
    }

    const bowlerErr = validateOpenerInXi(
      config.openingBowlerId,
      Array.from(bowlingXi),
      "Opening bowler",
    );
    if (bowlerErr) {
      return NextResponse.json({ error: bowlerErr }, { status: 400 });
    }

    await startMatch(
      matchId,
      body.teamAId as string,
      body.teamBId as string,
      config,
    );
    const updatedContext = await getMatchScoringContext(matchId);
    return NextResponse.json({ ok: true, context: updatedContext });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start match.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getTournamentPlayersPerTeam(tournamentId: string): Promise<number | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("tournaments")
    .select("players_per_team")
    .eq("id", tournamentId)
    .maybeSingle();
  const row = data as { players_per_team: number } | null;
  return row?.players_per_team ?? null;
}
