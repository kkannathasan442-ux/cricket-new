import { NextResponse } from "next/server";

import { listPlayers, createPlayer } from "@/features/players/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const players = await listPlayers();
    return NextResponse.json(players);
  } catch {
    return NextResponse.json({ error: "Failed to fetch players." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = ["player_name", "role", "team_id"];
    const missing = required.filter((field: string) => !body[field]);
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}` }, { status: 400 });
    }

    if (body.jersey_number) {
      const existing = await listPlayers();
      const duplicate = existing.find(
        (p) =>
          p.team_id === body.team_id &&
          p.jersey_number === body.jersey_number &&
          p.id !== "",
      );
      if (duplicate) {
        return NextResponse.json(
          { error: "Jersey number already exists for this team." },
          { status: 409 },
        );
      }
    }

    const player = await createPlayer({
      player_name: body.player_name,
      role: body.role,
      team_id: body.team_id,
      photo_url: body.photo_url ?? null,
      jersey_name: body.jersey_name ?? null,
      jersey_number: body.jersey_number ?? null,
      contact_number: body.contact_number ?? null,
    });

    return NextResponse.json(player, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create player.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
