import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Disable PWA in development to avoid service worker noise
  disable: process.env.NODE_ENV === "development",
  // Show offline fallback page when document fetch fails
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    runtimeCaching: [
      {
        // Network-first for API routes — fresh data when online, cached when not
        urlPattern: /^\/api\/(tasks|analytics|habits|tags|activity)/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        // Cache-first for static assets — icons, fonts, images
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
      {
        // Network-first for app pages
        urlPattern: /^\/(dashboard|analytics|habits|activity|tasks)(\/.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 24,
          },
          networkTimeoutSeconds: 8,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {};

export default withPWA(nextConfig);
