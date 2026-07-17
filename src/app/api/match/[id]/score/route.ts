import { NextResponse } from "next/server";

import { applyScoringEvent, undoLastBall } from "@/features/scoring/engine";
import { endInnings } from "@/features/scoring/innings";
import { getPlayingXi } from "@/features/scoring/playing-xi";
import {
  type ScoringActionType,
  type ScoringPayload,
} from "@/features/scoring";
import { assertPlayersInXi } from "@/features/scoring/validation";
import { requireRole } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

const VALID_RUNS = new Set([0, 1, 2, 3, 4, 6]);
const DELIVERY_ACTIONS: ScoringActionType[] = [
  "run",
  "wide",
  "no_ball",
  "bye",
  "leg_bye",
  "overthrow",
  "wicket",
];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["admin", "scorer"]);
  if (guard instanceof NextResponse) return guard;

  const { id: matchId } = await params;

  if (!isUuid(matchId)) {
    return NextResponse.json({ error: "Invalid match id." }, { status: 400 });
  }

  let body: Partial<ScoringPayload> & { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = body.action as ScoringActionType | undefined;
  if (!action) {
    return NextResponse.json({ error: "Missing action." }, { status: 400 });
  }

  try {
    if (action === "undo") {
      const { innings } = await undoLastBall(matchId);
      return NextResponse.json({ ok: true, innings });
    }

    if (action === "end_innings") {
      const { completed, nextInnings } = await endInnings(matchId);
      return NextResponse.json({
        ok: true,
        completedInnings: completed,
        nextInnings,
      });
    }

    if (!DELIVERY_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Unsupported action: ${action}` },
        { status: 400 },
      );
    }

    if (action === "run") {
      if (typeof body.runs !== "number" || !VALID_RUNS.has(body.runs)) {
        return NextResponse.json(
          { error: "Invalid runs value." },
          { status: 400 },
        );
      }
    }

    if (action === "wicket" && !body.dismissalType) {
      return NextResponse.json(
        { error: "Dismissal type is required for a wicket." },
        { status: 400 },
      );
    }

    const xi = await getPlayingXi(matchId);
    const xiIds = new Set(xi.map((row) => row.player_id));

    const batsmanId = body.batsmanId as string | undefined;
    const bowlerId = body.bowlerId as string | undefined;
    const nextBatsmanId = body.nextBatsmanId as string | undefined;

    if (batsmanId && !xiIds.has(batsmanId)) {
      return NextResponse.json(
        { error: "Batsman is not in the Playing XI." },
        { status: 400 },
      );
    }
    if (bowlerId && !xiIds.has(bowlerId)) {
      return NextResponse.json(
        { error: "Bowler is not in the Playing XI." },
        { status: 400 },
      );
    }
    if (nextBatsmanId && !xiIds.has(nextBatsmanId)) {
      return NextResponse.json(
        { error: "Next batsman is not in the Playing XI." },
        { status: 400 },
      );
    }

    const payload: ScoringPayload = {
      action,
      runs: body.runs,
      batsmanId,
      nonStrikerId: body.nonStrikerId,
      bowlerId,
      dismissalType: body.dismissalType,
      nextBatsmanId,
      nextBowlerId: body.nextBowlerId,
    };

    const result = await applyScoringEvent(matchId, payload);
    return NextResponse.json({
      ok: true,
      ball: result.ball,
      innings: result.innings,
      overCompleted: result.overCompleted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
