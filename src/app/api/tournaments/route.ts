import { NextResponse } from "next/server";

import { listTournaments, createTournament } from "@/features/tournaments/service";
import { requireRole } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireRole(["admin", "scorer", "viewer"]);
  if (guard instanceof NextResponse) return guard;

  try {
    const tournaments = await listTournaments();
    return NextResponse.json(tournaments);
  } catch {
    return NextResponse.json({ error: "Failed to fetch tournaments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireRole(["admin", "scorer"]);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const required = ["tournament_name", "start_date", "end_date", "status"];
    const missing = required.filter((field: string) => !body[field]);
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
    }

    const tournament = await createTournament({
      tournament_name: body.tournament_name,
      overs_per_match: body.overs_per_match ?? 20,
      max_teams: body.max_teams ?? 8,
      players_per_team: body.players_per_team ?? 11,
      start_date: body.start_date,
      end_date: body.end_date,
      status: body.status,
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create tournament.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
