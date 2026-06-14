"use client";

import { AuthGate } from "@/components/AuthGate";
import { AuthProvider } from "@/components/AuthProvider";
import { StudentClipboardGuard } from "@/components/StudentClipboardGuard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StudentClipboardGuard />
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
