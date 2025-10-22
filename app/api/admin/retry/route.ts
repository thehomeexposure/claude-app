import { NextResponse } from "next/server";

// keep this route dynamic
export const dynamic = "force-dynamic";

// Temporarily disabled until Job model/queue is wired up
export async function POST() {
  return NextResponse.json(
    { error: "Retry endpoint disabled (no Job model yet)" },
    { status: 501 }
  );
}