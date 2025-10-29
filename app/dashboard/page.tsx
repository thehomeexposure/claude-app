// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirectToSignIn } from "@clerk/nextjs";
import DashboardClient from "./dashboard-client";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard" });
  }
  return <DashboardClient />;
}
