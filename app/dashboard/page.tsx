// app/dashboard/page.tsx
import { auth, redirectToSignIn } from "@clerk/nextjs/server";
import DashboardClient from "./dashboard-client";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard" });
  }
  return <DashboardClient />;
}
