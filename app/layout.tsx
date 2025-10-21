import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'Image Processor',
  description: 'AI-powered image enhancement and processing',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-gray-50 min-h-screen">{children}</body>
      </html>
    </ClerkProvider>
  );
}
