// app/api/images/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/images/:id
export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    const image = await db.image.findFirst({
      where: { id: ctx.params.id, userId: user.id },
      // no `jobs` include since we don't have a Job model yet
    });

    if (!image) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Preserve expected shape if UI reads image.jobs
    return NextResponse.json({ image: { ...image, jobs: [] as unknown[] } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Get image error:", msg);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}