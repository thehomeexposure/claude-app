// app/api/upload/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const { projectId, url } = (body ?? {}) as {
      projectId?: string;
      url?: string;
    };

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Auto-create a project if one isn't provided
    let finalProjectId = projectId;
    
    if (!finalProjectId) {
      const defaultProject = await db.project.create({
        data: {
          userId: user.id,
          name: `Property ${new Date().toLocaleDateString()}`,
        },
      });
      finalProjectId = defaultProject.id;
    }

    // Now projectId is always defined
    const data: Prisma.ImageUncheckedCreateInput = {
      userId: user.id,
      url,
      projectId: finalProjectId,
    };

    const image = await db.image.create({ data });

    // keep response shape stable for any UI that expects jobs array
    return NextResponse.json(
      { image: { ...image, jobs: [] as unknown[] } },
      { status: 201 }
    );
  } catch (err) {
    console.error("upload/start error:", err);
    return NextResponse.json(
      { error: "Failed to create image record" },
      { status: 500 }
    );
  }
}
