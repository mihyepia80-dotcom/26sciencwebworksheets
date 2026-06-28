export const CONSENT_STORAGE_KEY = "sagodogu-service-consent";
export const CONSENT_VERSION = "2026-06-19";

export interface ServiceConsentState {
  privacy: boolean;
  terms: boolean;
  aiEthics: boolean;
  guardian: boolean;
}

export interface ServiceConsentRecord extends ServiceConsentState {
  version: string;
  agreedAt: string;
}

export const EMPTY_CONSENT: ServiceConsentState = {
  privacy: false,
  terms: false,
  aiEthics: false,
  guardian: false,
};

export function isConsentFormComplete(state: ServiceConsentState): boolean {
  return state.privacy && state.terms && state.aiEthics && state.guardian;
}

function readStoredConsent(): ServiceConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ServiceConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (!isConsentFormComplete(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getServiceConsent(): ServiceConsentRecord | null {
  return readStoredConsent();
}

export function hasServiceConsent(): boolean {
  return getServiceConsent() !== null;
}

export const CONSENT_UPDATED_EVENT = "sagodogu-consent-updated";

export function saveServiceConsent(state: ServiceConsentState): ServiceConsentRecord {
  const record: ServiceConsentRecord = {
    ...state,
    version: CONSENT_VERSION,
    agreedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT));
  }
  return record;
}
