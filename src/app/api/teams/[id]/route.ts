import { NextResponse } from "next/server";

import { getTeam, updateTeam, deleteTeam, listTeams } from "@/features/teams/service";
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
    return NextResponse.json({ error: "Invalid team id." }, { status: 400 });
  }

  const team = await getTeam(id);
  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  return NextResponse.json(team);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["admin", "scorer"]);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid team id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const allowed = ["team_name", "logo_url", "owner_name", "owner_phone"] as const;
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    if (patch.team_name) {
      const existing = await listTeams();
      const duplicate = existing.find(
        (t) => t.id !== id && t.team_name.toLowerCase() === (patch.team_name as string).toLowerCase(),
      );
      if (duplicate) {
        return NextResponse.json({ error: "A team with this name already exists." }, { status: 409 });
      }
    }

    const team = await updateTeam(id, patch);
    return NextResponse.json(team);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update team.";
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
    return NextResponse.json({ error: "Invalid team id." }, { status: 400 });
  }

  try {
    await deleteTeam(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete team.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
