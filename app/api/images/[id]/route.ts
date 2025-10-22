// app/api/images/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

// GET /api/images/:id
export const GET = async (_req: NextRequest, { params }: Params) => {
  try {
    const user = await requireAuth();

    const image = await db.image.findFirst({
      where: { id: params.id, userId: user.id },
      // NOTE: removed `include: { jobs: ... }` because we don't have a Job model
    });

    if (!image) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If your UI expects `image.jobs`, return an empty array to keep shape stable
    return NextResponse.json({ image: { ...image, jobs: [] as unknown[] } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Get image error:", msg);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
};