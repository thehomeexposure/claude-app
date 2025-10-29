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

export default clerkMiddleware((auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect everything else (handles redirect to sign-in automatically)
  auth().protect();

  // If the user is authenticated, continue
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