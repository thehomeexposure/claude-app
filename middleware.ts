cat > middleware.ts <<'TS'
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",               // home
    "/sign-in(.*)",    // Clerk sign-in
    "/sign-up(.*)",    // Clerk sign-up
    "/_not-found",     // not-found page
    "/api/webhooks(.*)"// webhooks (if any)
  ],
});

export const config = {
  matcher: ["/((?!_next|.*\\..*|favicon.ico).*)"],
};
TS