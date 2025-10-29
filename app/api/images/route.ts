// app/api/images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/images
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;

    const images = await db.image.findMany({
      where: {
        userId: user.id,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: "desc" },
      // removed include.jobs because there's no Job model yet
    });

    // Preserve shape if UI expects `image.jobs`
    const shaped = images.map((img) => ({ ...img, jobs: [] as unknown[] }));
    return NextResponse.json({ images: shaped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("List images error:", msg);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

// POST /api/images
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { projectId, url } = body as { projectId?: string; url?: string };

    if (!projectId || !url) {
      return NextResponse.json(
        { error: "projectId and url are required" },
        { status: 400 }
      );
    }

    const image = await db.image.create({
      data: { userId: user.id, projectId, url }
    });

    return NextResponse.json({ image: { ...image, jobs: [] as unknown[] } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Create image error:", msg);
    return NextResponse.json({ error: "Failed to create image" }, { status: 500 });
  }
}
