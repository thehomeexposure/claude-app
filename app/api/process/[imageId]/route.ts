// app/api/process/[imageId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/process/:imageId
export async function POST(req: NextRequest, context: unknown) {
  try {
    const user = await requireAuth(req);

    const imageId =
      (context as { params?: { imageId?: string } })?.params?.imageId;

    if (!imageId) {
      return NextResponse.json(
        { error: "Missing imageId in route params" },
        { status: 400 }
      );
    }

    // Ensure the image belongs to the user
    const image = await db.image.findFirst({
      where: { id: imageId, userId: user.id },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // No Job model yet — return a stubbed job payload so the UI can proceed.
    const job = {
      id: `queued-${Date.now()}`,
      imageId,
      status: "QUEUED",
      steps: [] as string[],
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, job }, { status: 202 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Process image error:", msg);
    return NextResponse.json(
      { error: "Failed to enqueue image processing" },
      { status: 500 }
    );
  }
}
