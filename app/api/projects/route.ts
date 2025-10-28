// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* ---------- GET: list user's projects (your existing behavior) ---------- */
export async function GET(_req: NextRequest) {
  try {
    let user: { id: string } | null = null;
    try {
      user = await requireAuth();
    } catch {
      return NextResponse.json({ projects: [] }, { status: 200 });
    }

    try {
      const projects = await db.project.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { images: true } },
        },
      });
      return NextResponse.json({ projects }, { status: 200 });
    } catch (dbErr) {
      console.error("DB error in /api/projects (GET):", dbErr);
      return NextResponse.json({ projects: [], note: "db_unavailable" }, { status: 200 });
    }
  } catch (err) {
    console.error("Unexpected error in /api/projects (GET):", err);
    return NextResponse.json({ projects: [], note: "unexpected_error" }, { status: 200 });
  }
}

/* ---------- POST: create a project (fixes your 405) ---------- */
export async function POST(req: NextRequest) {
  try {
    // require auth for creating projects
    const user = await requireAuth();

    const body = await req.json().catch(() => ({} as any));
    const name = (body?.name ?? "").trim();
    const description =
      typeof body?.description === "string" ? body.description.trim() : null;

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
      select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    // If Clerk throws because not signed in, surface 401 (so UI can redirect)
    if (err instanceof Error && /not signed in|unauth/i.test(err.message)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/projects (POST):", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}