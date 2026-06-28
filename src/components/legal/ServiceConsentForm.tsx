"use client";

import Link from "next/link";
import type { ServiceConsentState } from "@/lib/legal/consent";

interface ServiceConsentFormProps {
  value: ServiceConsentState;
  onChange: (next: ServiceConsentState) => void;
  idPrefix?: string;
}

const ITEMS = [
  {
    key: "privacy" as const,
    required: true,
    label: "개인정보처리방침",
    href: "/privacy",
  },
  {
    key: "terms" as const,
    required: true,
    label: "이용약관",
    href: "/terms",
  },
  {
    key: "aiEthics" as const,
    required: true,
    label: "AI 이용 안내",
    href: "/ai-ethics",
  },
  {
    key: "guardian" as const,
    required: true,
    label: "만 14세 미만인 경우, 학교 가정통신문 등을 통해 보호자 동의를 완료하였습니다",
    href: null,
  },
];

export function ServiceConsentForm({ value, onChange, idPrefix = "consent" }: ServiceConsentFormProps) {
  const toggle = (key: keyof ServiceConsentState) => {
    onChange({ ...value, [key]: !value[key] });
  };

  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">서비스 이용 동의</legend>
      {ITEMS.map((item) => {
        const inputId = `${idPrefix}-${item.key}`;
        return (
          <label
            key={item.key}
            htmlFor={inputId}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-800"
          >
            <input
              id={inputId}
              type="checkbox"
              checked={value[item.key]}
              onChange={() => toggle(item.key)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <span>
              <span className="font-semibold text-violet-700">(필수)</span>{" "}
              {item.href ? (
                <>
                  <Link href={item.href} className="font-medium text-blue-700 underline-offset-2 hover:underline">
                    {item.label}
                  </Link>
                  에 동의합니다.
                </>
              ) : (
                item.label
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
