"use client";

import type { TemplateProps } from "@/lib/types";
import { fieldValue as v } from "@/components/templates/utils";
import { HEADLINE_PLACEHOLDERS } from "@/lib/templates/headlines";
import { useWorksheetContent } from "@/hooks/useWorksheetContent";

export function HeadlineTemplate({ values, onChange, readOnly }: TemplateProps) {
  const { get } = useWorksheetContent("headline");

  return (
    <div className="headline-worksheet mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 print:shadow-none">
        <div className="mb-6 border-b border-slate-200 pb-6 text-center">
          <p className="text-xs font-medium text-slate-500">{get("unit")}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
            표제 만들기
          </h2>
          <p className="mt-2 text-base text-slate-600">{get("topic")}</p>
        </div>

        <div className="mb-8 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
          <h3 className="mb-2 text-sm font-bold text-teal-900">탐구 데이터 리마인더</h3>
          <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-teal-900/90">
            {get("reminder1") && <li>{get("reminder1")}</li>}
            {get("reminder2") && <li>{get("reminder2")}</li>}
          </ul>
        </div>

        <p className="mb-6 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm leading-relaxed text-slate-700">
          {get("writingGuide")}
        </p>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 p-5 shadow-sm print:shadow-none">
            <label className="ui-label">표제 작성</label>
            <p className="mb-3 text-base text-slate-600">
              탐구 내용의 핵심 본질과 가치를 한 줄로 관통하는 제목을 작성하세요.
            </p>
            <input
              type="text"
              className="ui-input"
              value={v(values, "headline")}
              disabled={readOnly}
              placeholder={HEADLINE_PLACEHOLDERS.headline}
              onChange={(e) => onChange("headline", e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-5 shadow-sm print:shadow-none">
            <label className="ui-label">이유 서술하기</label>
            <p className="mb-3 text-base text-slate-600">
              왜 그렇게 표제를 정했는지, 과학적 사실(실험·조사 데이터)과 인과 관계를 담아 서술하세요.
            </p>
            <textarea
              className="ui-textarea min-h-[12rem]"
              rows={8}
              value={v(values, "headlineReason")}
              disabled={readOnly}
              placeholder={HEADLINE_PLACEHOLDERS.reason}
              onChange={(e) => onChange("headlineReason", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
