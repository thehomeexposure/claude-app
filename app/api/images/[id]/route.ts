// app/api/images/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/images
export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const images = await db.image.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      // NOTE: removed include.jobs because we don't have a Job model yet
    });

    // If UI expects image.jobs, give empty arrays to keep shape stable
    const shaped = images.map((img) => ({ ...img, jobs: [] as unknown[] }));
    return NextResponse.json({ images: shaped });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("List images error:", msg);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

// POST /api/images  (keep if you already had it; safe stub below)
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { projectId, url } = body as { projectId: string; url: string };

    if (!projectId || !url) {
      return NextResponse.json(
        { error: "projectId and url are required" },
        { status: 400 }
      );
    }

    const image = await db.image.create({
      data: { userId: user.id, projectId, url },
    });

    return NextResponse.json({ image: { ...image, jobs: [] as unknown[] } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Create image error:", msg);
    return NextResponse.json({ error: "Failed to create image" }, { status: 500 });
  }
}