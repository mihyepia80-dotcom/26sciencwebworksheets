"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_CONSENT,
  CONSENT_UPDATED_EVENT,
  getServiceConsent,
  hasServiceConsent,
  isConsentFormComplete,
  saveServiceConsent,
  type ServiceConsentState,
} from "@/lib/legal/consent";
import { ServiceConsentForm } from "./ServiceConsentForm";
import { useAuth } from "@/components/AuthProvider";
import { isGuest } from "@/lib/auth/access";

export function HomeServiceConsentSection() {
  const { user, role } = useAuth();
  const [consent, setConsent] = useState<ServiceConsentState>(EMPTY_CONSENT);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const stored = getServiceConsent();
      if (stored) {
        setConsent({
          privacy: stored.privacy,
          terms: stored.terms,
          aiEthics: stored.aiEthics,
          guardian: stored.guardian,
        });
        setCompleted(true);
      } else {
        setCompleted(false);
      }
      setReady(true);
    };
    sync();
    window.addEventListener(CONSENT_UPDATED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, sync);
  }, []);

  if (!ready || !isGuest(user, role)) return null;

  const handleSave = () => {
    if (!isConsentFormComplete(consent)) {
      setError("필수 항목을 모두 확인·동의해 주세요.");
      return;
    }
    saveServiceConsent(consent);
    setCompleted(true);
    setError("");
  };

  return (
    <section className="ui-panel-soft mb-8" aria-labelledby="home-consent-heading">
      <h2 id="home-consent-heading" className="ui-section-title text-2xl">
        서비스 이용 안내 및 동의
      </h2>
      {completed || hasServiceConsent() ? (
        <p className="mt-4 text-lg leading-relaxed text-emerald-800">
          필수 약관·정책 확인 및 동의가 완료되었습니다. 변경된 정책이 있으면 다시 안내드립니다.
        </p>
      ) : (
        <>
          <p className="ui-section-desc text-base">
            학습지 체험·저장·제출 및 AI 보조 기능 이용 전, 아래 내용을 확인하고 동의해 주세요.
          </p>
          <div className="mt-4">
            <ServiceConsentForm value={consent} onChange={setConsent} idPrefix="home-section-consent" />
          </div>
          {error && <p className="ui-message-error mt-4 py-3 text-base">{error}</p>}
          <button type="button" className="ui-btn-primary mt-6" onClick={handleSave}>
            동의하고 계속하기
          </button>
        </>
      )}
    </section>
  );
}
