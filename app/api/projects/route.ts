// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    // Try auth; if not logged in, return empty list instead of throwing
    let user: { id: string } | null = null;
    try {
      user = await requireAuth();
    } catch {
      return NextResponse.json({ projects: [] }, { status: 200 });
    }

    // If we do have a user, try to read projects
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
      console.error("DB error in /api/projects:", dbErr);
      // Return empty payload so UI doesn’t break
      return NextResponse.json({ projects: [], note: "db_unavailable" }, { status: 200 });
    }
  } catch (err) {
    console.error("Unexpected error in /api/projects:", err);
    // Final fallback: still 200 with empty list
    return NextResponse.json({ projects: [], note: "unexpected_error" }, { status: 200 });
  }
}