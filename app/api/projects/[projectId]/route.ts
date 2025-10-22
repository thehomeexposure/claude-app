// app/api/projects/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

// Ensure this route is never statically cached
export const dynamic = "force-dynamic";

// ---------- GET /api/projects/[projectId] ----------
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  try {
    const user = await requireAuth();
    const { projectId } = await params;

    const project = await db.project.findUnique({
      where: {
        id: projectId,
        userId: user.id, // Ensure user owns this project
      },
      include: {
        images: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            url: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Get project error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
