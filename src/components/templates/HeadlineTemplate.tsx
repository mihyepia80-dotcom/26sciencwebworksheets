"use client";

import type { TemplateProps } from "@/lib/types";
import { fieldValue as v } from "@/components/templates/utils";
import {
  HEADLINE_CHECKLIST,
  HEADLINE_GUIDE,
  HEADLINE_PLACEHOLDERS,
  HEADLINE_REMINDERS,
  HEADLINE_TOPIC,
  HEADLINE_UNIT,
} from "@/lib/templates/headlines";

export function HeadlineTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <div className="headline-worksheet mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 print:shadow-none">
        <div className="mb-6 border-b border-slate-200 pb-6 text-center">
          <p className="text-xs font-medium text-slate-500">{HEADLINE_UNIT}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
            Headlines (헤드라인) — Visible Thinking
          </h2>
          <p className="mt-2 text-sm text-slate-600">{HEADLINE_TOPIC}</p>
        </div>

        <div className="mb-8 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
          <h3 className="mb-2 text-sm font-bold text-teal-900">탐구 데이터 리마인더</h3>
          <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-teal-900/90">
            {HEADLINE_REMINDERS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <p className="mb-6 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm leading-relaxed text-slate-700">
          {HEADLINE_GUIDE}
        </p>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 p-5 shadow-sm print:shadow-none">
            <label className="mb-2 block text-sm font-bold text-slate-800">헤드라인 뽑기</label>
            <p className="mb-3 text-xs text-slate-500">
              탐구 내용의 핵심 본질과 가치를 한 줄로 관통하는 제목을 작성하세요.
            </p>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none disabled:bg-slate-50"
              value={v(values, "headline")}
              disabled={readOnly}
              placeholder={HEADLINE_PLACEHOLDERS.headline}
              onChange={(e) => onChange("headline", e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-5 shadow-sm print:shadow-none">
            <label className="mb-2 block text-sm font-bold text-slate-800">이유 서술하기</label>
            <p className="mb-3 text-xs text-slate-500">
              왜 그렇게 헤드라인을 뽑았는지, 과학적 사실(실험·조사 데이터)과 인과 관계를 담아 서술하세요.
            </p>
            <textarea
              className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm leading-relaxed text-slate-800 focus:border-blue-500 focus:outline-none disabled:bg-slate-50"
              rows={8}
              value={v(values, "headlineReason")}
              disabled={readOnly}
              placeholder={HEADLINE_PLACEHOLDERS.reason}
              onChange={(e) => onChange("headlineReason", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="mb-3 text-sm font-bold text-slate-800">메타인지 셀프 체크리스트</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            {HEADLINE_CHECKLIST.map(({ key, label }) => (
              <li key={key}>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    checked={v(values, key) === "true"}
                    disabled={readOnly}
                    onChange={(e) => onChange(key, e.target.checked ? "true" : "")}
                  />
                  <span>{label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
