"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";

/** App-wide client-side providers. Kept out of layout.tsx so the root layout stays a Server Component. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  useAuthBootstrap();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
