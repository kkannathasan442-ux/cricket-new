import { NextResponse } from "next/server";

import { listTournaments } from "@/features/tournaments";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tournaments = await listTournaments();
    return NextResponse.json(tournaments);
  } catch {
    return NextResponse.json({ error: "Failed to fetch tournaments." }, { status: 500 });
  }
}
