import { NextResponse } from "next/server";

import { getTournament, updateTournament, deleteTournament } from "@/features/tournaments/service";
import { requireRole } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["admin", "scorer", "viewer"]);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid tournament id." }, { status: 400 });
  }

  const tournament = await getTournament(id);
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  }

  return NextResponse.json(tournament);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["admin", "scorer"]);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid tournament id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const allowed = [
      "tournament_name",
      "overs_per_match",
      "max_teams",
      "players_per_team",
      "start_date",
      "end_date",
      "status",
    ] as const;
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    const tournament = await updateTournament(id, patch);
    return NextResponse.json(tournament);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update tournament.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["admin", "scorer"]);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid tournament id." }, { status: 400 });
  }

  try {
    await deleteTournament(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete tournament.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
