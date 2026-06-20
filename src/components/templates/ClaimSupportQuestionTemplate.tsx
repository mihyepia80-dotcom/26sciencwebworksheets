"use client";

import type { TemplateProps } from "@/lib/types";
import { fieldValue as v } from "@/components/templates/utils";
import { CSQ_CHECKLIST, CSQ_INQUIRY_MEMO, CSQ_SECTIONS } from "@/lib/templates/csq";

export function ClaimSupportQuestionTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <div className="csq-worksheet mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 print:shadow-none">
        <div className="mb-6 border-b border-slate-200 pb-6 text-center">
          <h2 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">과학과 성장 포트폴리오</h2>
          <p className="mt-1 text-sm text-slate-500">CSQ 루틴 기반 과학 성찰 글쓰기 (용액의 진하기 비교)</p>
        </div>

        <div className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h3 className="mb-2 text-sm font-bold text-indigo-900">나의 탐구 데이터 핵심 메모</h3>
          <ul className="list-disc space-y-1 pl-4 text-xs text-indigo-800">
            {CSQ_INQUIRY_MEMO.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          {CSQ_SECTIONS.map(({ key, badge, badgeClass, title, guide, placeholder, rows, focusClass }) => (
            <div key={key} className="rounded-xl border border-slate-200 p-5 shadow-sm print:shadow-none">
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-sm px-2 py-0.5 text-xs font-bold text-white ${badgeClass}`}>{badge}</span>
                <span className="text-base font-bold text-slate-800">{title}</span>
              </div>
              <p className="mb-3 text-xs text-slate-500">{guide}</p>
              <textarea
                className={`w-full resize-y rounded-lg border border-slate-200 p-3 text-sm text-slate-700 focus:outline-none disabled:bg-slate-50 ${focusClass}`}
                rows={rows}
                value={v(values, key)}
                disabled={readOnly}
                placeholder={placeholder}
                onChange={(e) => onChange(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="mb-3 text-sm font-bold text-slate-800">나의 글 최종 점검 (셀프 체크)</h3>
          <div className="mb-6 space-y-2 text-sm text-slate-600">
            {CSQ_CHECKLIST.map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={v(values, key) === "true"}
                  disabled={readOnly}
                  onChange={(e) => onChange(key, e.target.checked ? "true" : "")}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
