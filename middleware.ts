// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that DON'T require auth
const isPublicRoute = createRouteMatcher([
  "/",                 // home
  "/sign-in(.*)",      // Clerk sign-in
  "/sign-up(.*)",      // Clerk sign-up
  "/_not-found",       // not-found
  "/api/webhooks(.*)", // webhooks (if any)
]);

export default clerkMiddleware((auth, req) => {
  // Protect everything that's not public
  if (!isPublicRoute(req)) auth().protect();
});

// Run on app routes; skip Next assets & static files; always run for API
export const config = {
  matcher: [
    "/((?!_next|.*\\..*|favicon.ico).*)",
    "/(api|trpc)(.*)",
  ],
};