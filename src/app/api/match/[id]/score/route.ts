import { NextResponse } from "next/server";

import {
  applyScoringEvent,
  undoLastBall,
} from "@/features/scoring/engine";
import {
  type ScoringActionType,
  type ScoringPayload,
} from "@/features/scoring";

export const dynamic = "force-dynamic";

const VALID_RUNS = new Set([0, 1, 2, 3, 4, 6]);

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
    return NextResponse.json(
      { error: "Invalid match id." },
      { status: 400 },
    );
  }

  let body: Partial<ScoringPayload>;
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

    if (action === "run") {
      if (typeof body.runs !== "number" || !VALID_RUNS.has(body.runs)) {
        return NextResponse.json(
          { error: "Invalid runs value." },
          { status: 400 },
        );
      }
    }

    if (action === "wicket" && body.dismissalType === undefined) {
      // dismissalType optional upstream; default allowed.
    }

    const payload: ScoringPayload = {
      action,
      runs: body.runs,
      batsmanId: body.batsmanId,
      bowlerId: body.bowlerId,
      dismissalType: body.dismissalType,
    };

    const { ball, innings } = await applyScoringEvent(matchId, payload);
    return NextResponse.json({ ok: true, ball, innings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
