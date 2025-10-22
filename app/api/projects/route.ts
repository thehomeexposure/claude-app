// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

// Ensure this route is never statically cached
export const dynamic = "force-dynamic";

// ---------- GET /api/projects ----------
export const GET = async (_req: NextRequest) => {
  try {
    const user = await requireAuth();

    const projects = await db.project.findMany({
      where: { userId: user.id },
      include: { _count: { select: { images: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Get projects error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

// ---------- POST /api/projects ----------
export const POST = async (req: NextRequest) => {
  try {
    const user = await requireAuth();
    const body = (await req.json()) as {
      name?: string;
      description?: string | null;
    };

    const name = body?.name?.trim();
    const description = body?.description?.trim() || null;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await db.project.create({
      data: {
        userId: user.id,
        name,
        description,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Create project error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
};