"use client";

import type { TemplateProps } from "@/lib/types";
import { fieldValue as v } from "@/components/templates/utils";
import {
  CLOSING_CHECKLIST,
  CLOSING_HEADLINE_KEY,
  TEMPLATES_SKIP_CLOSING_HEADLINE,
} from "@/lib/worksheet-closing/constants";

interface WorksheetClosingSectionProps extends Pick<TemplateProps, "values" | "onChange" | "readOnly"> {
  templateId: string;
}

export function WorksheetClosingSection({
  templateId,
  values,
  onChange,
  readOnly,
}: WorksheetClosingSectionProps) {
  const showHeadline = !TEMPLATES_SKIP_CLOSING_HEADLINE.has(templateId);

  return (
    <section className="worksheet-closing ui-card mt-10 p-6 print:border-slate-300 print:bg-white">
      {showHeadline && (
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-bold text-slate-800">최종 한 줄 결론</h3>
          <p className="mb-4 text-base text-slate-600">
            오늘 탐구·글쓰기에서 발견한 핵심을 한 문장으로 정리하세요.
          </p>
          <input
            type="text"
            className="ui-input"
            value={v(values, CLOSING_HEADLINE_KEY)}
            disabled={readOnly}
            placeholder="예: 용액은 일정한 성질을 유지하므로 우리 생활에서 믿고 쓸 수 있다."
            onChange={(e) => onChange(CLOSING_HEADLINE_KEY, e.target.value)}
          />
        </div>
      )}

      <div className={showHeadline ? "border-t border-slate-100 pt-6" : ""}>
        <h3 className="mb-4 text-lg font-bold text-slate-800">나의 글 최종 점검 (셀프 체크)</h3>
        <ul className="space-y-3 text-base text-slate-700">
          {CLOSING_CHECKLIST.map(({ key, label }) => (
            <li key={key}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
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
    </section>
  );
}
