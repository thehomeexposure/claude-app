// app/api/upload/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const {
      projectId,
      url,
      filename,
      mimeType,
      size,
    }: {
      projectId?: string;
      url?: string;
      filename?: string;
      mimeType?: string;
      size?: number;
    } = body ?? {};

    if (!url || !filename || !mimeType || typeof size !== "number") {
      return NextResponse.json(
        { error: "url, filename, mimeType, and size are required" },
        { status: 400 }
      );
    }

    const image = await db.image.create({
      data: {
        userId: user.id,
        // only set projectId if provided; avoids `string | undefined` type error
        ...(projectId ? { projectId } : {}),
        originalUrl: url,
        filename,
        mimeType,
        size,
      },
    });

    // keep response shape future-proof
    return NextResponse.json({ image: { ...image, jobs: [] as unknown[] } }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("upload/start error:", msg);
    return NextResponse.json({ error: "Failed to create image record" }, { status: 500 });
  }
}