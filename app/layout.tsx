import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Focal — Stay on target",
  description:
    "Focal is a focused productivity app for managing tasks, habits, and goals across all your life domains.",
  applicationName: "Focal",
  // PWA / Apple
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Focal",
    startupImage: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

// Separate viewport export — required by Next.js 14+ for themeColor
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Apple touch icon — for iOS home screen */}
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        </head>
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
          <Toaster richColors position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
