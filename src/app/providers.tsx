"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { OfflineProvider } from "@/lib/offline-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <OfflineProvider>
        {children}
      </OfflineProvider>
    </AuthProvider>
  );
}
