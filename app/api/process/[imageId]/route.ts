// app/api/process/[imageId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/process/:imageId
export async function POST(_req: NextRequest, context: any) {
  try {
    const user = await requireAuth();
    const imageId = context?.params?.imageId as string;

    // Ensure the image belongs to the user
    const image = await db.image.findFirst({
      where: { id: imageId, userId: user.id },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // NOTE: We used to create a Job row here (db.job.create).
    // Since there's no Job model yet, we return a stubbed job payload.
    const job = {
      id: `queued-${Date.now()}`,
      imageId,
      status: "QUEUED",
      steps: [] as string[], // fill later if you add real steps
      createdAt: new Date().toISOString(),
    };

    // If you later wire a real queue, enqueue here instead of returning a stub.

    return NextResponse.json({ ok: true, job }, { status: 202 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Process image error:", msg);
    return NextResponse.json({ error: "Failed to enqueue image processing" }, { status: 500 });
  }
}