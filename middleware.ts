// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public (no auth required)
const isPublicRoute = createRouteMatcher([
  "/",                 // home
  "/sign-in(.*)",      // Clerk sign-in
  "/sign-up(.*)",      // Clerk sign-up
  "/_not-found",       // not-found
  "/api/webhooks(.*)", // webhooks (if any)
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect everything that's not public
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

// Run on app routes; skip Next assets & static files; always run for API
export const config = {
  matcher: [
    "/((?!_next|.*\\..*|favicon.ico).*)",
    "/(api|trpc)(.*)",
  ],
};