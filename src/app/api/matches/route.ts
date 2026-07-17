import { NextResponse } from "next/server";

import { listMatches } from "@/features/matches/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const matches = await listMatches();
    return NextResponse.json(matches);
  } catch {
    return NextResponse.json({ error: "Failed to fetch matches." }, { status: 500 });
  }
}
