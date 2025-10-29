// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* GET /api/projects */
export async function GET(req: NextRequest) {
  try {
    // If not signed in, just return an empty list (don’t throw)
    let user: Awaited<ReturnType<typeof requireAuth>> | null = null;
    try {
      user = await requireAuth(req);
    } catch {
      return NextResponse.json({ projects: [], user: null }, { status: 200 });
    }

    try {
      const projects = await db.project.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: { select: { images: true } },
        },
      });
      let profile: {
        displayName: string;
        email: string | null;
        imageUrl: string | null;
      } | null = null;

      if (user) {
        const fallbackName =
          user.email?.split("@")[0] || "Agent";
        profile = {
          displayName: fallbackName,
          email: user.email ?? null,
          imageUrl: null,
        };

        if (process.env.CLERK_SECRET_KEY) {
          try {
            const client =
              typeof clerkClient === "function" ? await clerkClient() : clerkClient;
            const clerkUser = await client.users.getUser(user.clerkId);
            profile.displayName =
              clerkUser.fullName?.trim() ||
              clerkUser.username ||
              clerkUser.emailAddresses?.[0]?.emailAddress ||
              profile.displayName;
            profile.email =
              clerkUser.emailAddresses?.[0]?.emailAddress ?? profile.email;
            profile.imageUrl = clerkUser.imageUrl || profile.imageUrl;
          } catch (clerkErr) {
            if (process.env.NODE_ENV !== "production") {
              console.error("Failed to load Clerk profile", clerkErr);
            }
          }
        }
      }

      return NextResponse.json({ projects, user: profile }, { status: 200 });
    } catch (dbErr) {
      console.error("DB error in GET /api/projects:", dbErr);
      return NextResponse.json(
        { projects: [], user: null, note: "db_unavailable" },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error("Unexpected error in GET /api/projects:", err);
    return NextResponse.json(
      { projects: [], user: null, note: "unexpected_error" },
      { status: 200 }
    );
  }
}

/* POST /api/projects */
export async function POST(req: NextRequest) {
  try {
    // Must be signed in to create a project
    const user = await requireAuth(req);

    // Safe parse body
    const bodyUnknown = await req.json().catch(() => null as unknown);
    if (!bodyUnknown || typeof bodyUnknown !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const body = bodyUnknown as { name?: string; description?: string };

    const name = (body.name ?? "").toString().trim();
    const description = body.description ? body.description.toString().trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
      },
      select: { id: true, name: true, description: true, createdAt: true },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err: unknown) {
    // If auth failed in requireAuth(), return 401
    const message = err instanceof Error ? err.message : "";
    if (message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("auth")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/projects error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
