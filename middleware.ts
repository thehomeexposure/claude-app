// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes (no auth)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/_not-found",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session.userId) {
    const redirectUrl = new URL("/sign-in", req.url);
    redirectUrl.searchParams.set("redirect_url", req.nextUrl.pathname || "/dashboard");
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

// Recommended matcher from Clerk docs
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)", // all app routes except static files & _next
    "/",
    "/(api|trpc)(.*)",            // include API routes
  ],
};
