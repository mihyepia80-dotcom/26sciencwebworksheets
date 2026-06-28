"use client";

import { useEffect, useState } from "react";
import {
  EMPTY_CONSENT,
  CONSENT_UPDATED_EVENT,
  hasServiceConsent,
  isConsentFormComplete,
  saveServiceConsent,
  type ServiceConsentState,
} from "@/lib/legal/consent";
import { ServiceConsentForm } from "./ServiceConsentForm";

interface ServiceConsentModalProps {
  onAccepted?: () => void;
}

export function ServiceConsentModal({ onAccepted }: ServiceConsentModalProps) {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<ServiceConsentState>(EMPTY_CONSENT);
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => setOpen(!hasServiceConsent());
    sync();
    window.addEventListener(CONSENT_UPDATED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, sync);
  }, []);

  const handleAccept = () => {
    if (!isConsentFormComplete(consent)) {
      setError("필수 항목을 모두 확인·동의해 주세요.");
      return;
    }
    saveServiceConsent(consent);
    setOpen(false);
    setError("");
    onAccepted?.();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-consent-title"
    >
      <div className="ui-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-xl">
        <h2 id="service-consent-title" className="text-xl font-bold text-slate-900">
          서비스 이용 안내 및 동의
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          사고도구 톡톡은 초등 과학 탐구·사고기법 학습지를 제공합니다. 학생 로그인 시 학년·반·번호·이름과
          작성 내용이 저장될 수 있으며, AI 보조 기능 이용 시 학습 내용 일부가 전송될 수 있습니다. 아래 내용을
          확인한 뒤 동의해 주세요.
        </p>

        <div className="mt-5">
          <ServiceConsentForm value={consent} onChange={setConsent} idPrefix="home-consent" />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          className="ui-btn-primary mt-5 w-full"
          onClick={handleAccept}
        >
          동의하고 시작하기
        </button>
      </div>
    </div>
  );
}
