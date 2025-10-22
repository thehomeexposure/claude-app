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
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Build `data` without any `undefined` fields
    const data =
      projectId
        ? { userId: user.id, projectId, url }
        : { userId: user.id, url };

    const image = await db.image.create({ data });

    // keep response shape stable for any UI that expects jobs array
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