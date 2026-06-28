"use client";

import Link from "next/link";
import { ServiceConsentForm } from "./ServiceConsentForm";
import type { ServiceConsentState } from "@/lib/legal/consent";
import { isConsentFormComplete } from "@/lib/legal/consent";

interface ServiceConsentPanelProps {
  value: ServiceConsentState;
  onChange: (next: ServiceConsentState) => void;
}

export function ServiceConsentPanel({ value, onChange }: ServiceConsentPanelProps) {
  const complete = isConsentFormComplete(value);

  return (
    <section className="ui-panel-soft" aria-labelledby="login-consent-heading">
      <h2 id="login-consent-heading" className="ui-section-title text-2xl">
        서비스 이용 동의
      </h2>
      <p className="ui-section-desc text-base">
        로그인·저장·제출 기능을 이용하려면 아래 필수 항목에 동의해 주세요. 정책 전문은 각 링크에서 확인할 수
        있습니다.
      </p>

      <div className="mt-4">
        <ServiceConsentForm value={value} onChange={onChange} idPrefix="login-consent" />
      </div>

      {!complete && (
        <p className="mt-4 text-base font-medium text-amber-800">
          모든 필수 항목에 동의해야 로그인할 수 있습니다.
        </p>
      )}

      <p className="mt-5 text-base text-slate-600">
        로그인 없이 체험만 하려면{" "}
        <Link href="/" className="font-semibold text-violet-700 underline-offset-2 hover:underline">
          메인 화면
        </Link>
        으로 돌아가세요. 체험 시에도 최초 1회 동의 확인이 필요합니다.
      </p>
    </section>
  );
}
