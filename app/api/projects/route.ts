// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* ---------- GET: list user's projects ---------- */
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
    } catch (dbErr: unknown) {
      console.error("DB error in /api/projects (GET):", dbErr);
      return NextResponse.json({ projects: [], note: "db_unavailable" }, { status: 200 });
    }
  } catch (err: unknown) {
    console.error("Unexpected error in /api/projects (GET):", err);
    return NextResponse.json({ projects: [], note: "unexpected_error" }, { status: 200 });
  }
}

/* ---------- POST: create a project ---------- */
type CreateProjectPayload = {
  name: string;
  description?: string | null;
};

function parseCreatePayload(u: unknown): CreateProjectPayload {
  const obj = (typeof u === "object" && u !== null) ? (u as Record<string, unknown>) : {};
  const name = typeof obj.name === "string" ? obj.name.trim() : "";
  const description =
    typeof obj.description === "string" ? obj.description.trim() :
    obj.description == null ? null : undefined;
  return { name, description };
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const raw = await req.json().catch(() => ({}));
    const { name, description } = parseCreatePayload(raw);

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await db.project.create({
      data: { userId: user.id, name, description: description ?? null },
      select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && /not signed in|unauth/i.test(err.message)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/projects (POST):", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}