"use client";

import { ServiceConsentModal } from "./ServiceConsentModal";

export function HomeConsentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ServiceConsentModal />
    </>
  );
}
