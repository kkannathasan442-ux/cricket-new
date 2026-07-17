import { NextResponse } from "next/server";

import { getPlayer, updatePlayer, deletePlayer } from "@/features/players/service";
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
    return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
  }

  const player = await getPlayer(id);
  if (!player) {
    return NextResponse.json({ error: "Player not found." }, { status: 404 });
  }

  return NextResponse.json(player);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireRole(["admin", "scorer"]);
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const allowed = [
      "player_name",
      "photo_url",
      "role",
      "jersey_name",
      "jersey_number",
      "contact_number",
      "team_id",
    ] as const;
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    const player = await updatePlayer(id, patch);
    return NextResponse.json(player);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update player.";
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
    return NextResponse.json({ error: "Invalid player id." }, { status: 400 });
  }

  try {
    await deletePlayer(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete player.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
