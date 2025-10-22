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
      url, // public blob URL you already created
    }: {
      projectId?: string;
      url?: string;
    } = body ?? {};

    if (!url) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    const image = await db.image.create({
      data: {
        userId: user.id,
        ...(projectId ? { projectId } : {}),
        // Your schema does NOT have `originalUrl`; use `url`
        url,
      },
    });

    // keep response shape stable for the UI
    return NextResponse.json(
      { image: { ...image, jobs: [] as unknown[] } },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("upload/start error:", msg);
    return NextResponse.json(
      { error: "Failed to create image record" },
      { status: 500 }
    );
  }
}