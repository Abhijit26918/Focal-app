import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";

/**
 * Layout for all Clerk-authenticated routes.
 * Isolated so that public pages (offline, not-found, landing) are never
 * wrapped in ClerkProvider — which would fail at build time without a key.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ReactQueryProvider>
        {children}
        <Toaster richColors position="bottom-right" />
      </ReactQueryProvider>
    </ClerkProvider>
  );
}
