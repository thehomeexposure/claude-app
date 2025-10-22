// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Public routes (no auth required)
  publicRoutes: [
    "/",               // home
    "/sign-in(.*)",    // Clerk sign-in
    "/sign-up(.*)",    // Clerk sign-up
    "/_not-found",     // not-found page
    "/api/webhooks(.*)"// any webhooks you may have
  ],
});

// Run on app routes; skip Next assets & static files
export const config = {
  matcher: ["/((?!_next|.*\\..*|favicon.ico).*)"],
};