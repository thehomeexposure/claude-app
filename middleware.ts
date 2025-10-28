// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/_not-found",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    // Always allow public routes
    if (isPublicRoute(req)) return NextResponse.next();

    // Get auth state (don’t throw)
    const { userId, redirectToSignIn } = await auth();

    // If not signed in:
    if (!userId) {
      // In Netlify deploy-previews, don’t block or crash — let the UI render
      if (process.env.NETLIFY && process.env.CONTEXT === "deploy-preview") {
        return NextResponse.next();
      }
      // In production, redirect to Clerk sign-in (no throw)
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    return NextResponse.next();
  } catch (err) {
    // Never crash the edge function; log and continue
    console.error("Middleware error:", err);
    return NextResponse.next();
  }
});

// Run on app routes; skip Next assets & static files
export const config = {
  matcher: ["/((?!_next|.*\\..*|favicon.ico).*)", "/(api|trpc)(.*)"],
};