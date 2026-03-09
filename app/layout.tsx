import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Focal — Stay on target",
  description:
    "Focal is a focused productivity app for managing tasks, habits, and goals across all your life domains.",
  applicationName: "Focal",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
