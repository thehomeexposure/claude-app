// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Home Exposure",
  description: "Luxury real estate photo management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[#0a0a0b] text-zinc-100 antialiased">
        {/* Background glow overlay */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1000px_600px_at_20%_-10%,rgba(59,130,246,0.10),transparent)]" />
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}