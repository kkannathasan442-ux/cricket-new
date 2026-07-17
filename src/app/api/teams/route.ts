import { NextResponse } from "next/server";

import { listTeams, createTeam } from "@/features/teams/service";
import { requireRole } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireRole(["admin", "scorer", "viewer"]);
  if (guard instanceof NextResponse) return guard;

  try {
    const teams = await listTeams();
    return NextResponse.json(teams);
  } catch {
    return NextResponse.json({ error: "Failed to fetch teams." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const guard = await requireRole(["admin", "scorer"]);
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json();
    const required = ["team_name", "owner_name"];
    const missing = required.filter((field: string) => !body[field]);
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
    }

    const existing = await listTeams();
    const duplicate = existing.find(
      (t) => t.team_name.toLowerCase() === body.team_name.toLowerCase(),
    );
    if (duplicate) {
      return NextResponse.json({ error: "A team with this name already exists." }, { status: 409 });
    }

    const team = await createTeam({
      team_name: body.team_name,
      owner_name: body.owner_name,
      logo_url: body.logo_url ?? null,
      owner_phone: body.owner_phone ?? null,
    });

    return NextResponse.json(team, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create team.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
