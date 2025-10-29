// app/dashboard/page.tsx
import { auth, redirectToSignIn } from "@clerk/nextjs/server";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard" });
    // (Your version with `redirect("/sign-in?redirect_url=/dashboard")` also works;
    // this is just the Clerk helper.)
  }
  return <DashboardClient />;
}