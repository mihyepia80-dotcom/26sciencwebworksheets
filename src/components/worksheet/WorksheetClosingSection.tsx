"use client";

import type { TemplateProps } from "@/lib/types";
import { fieldValue as v } from "@/components/templates/utils";
import {
  CLOSING_CHECKLIST,
  CLOSING_HEADLINE_KEY,
  TEMPLATES_SKIP_CLOSING_HEADLINE,
} from "@/lib/worksheet-closing/constants";
import { getLessonClosingChecklist } from "@/lib/worksheet-content/dissolution-lesson-forms";

interface WorksheetClosingSectionProps extends Pick<TemplateProps, "values" | "onChange" | "readOnly" | "period"> {
  templateId: string;
}

export function WorksheetClosingSection({
  templateId,
  period,
  values,
  onChange,
  readOnly,
}: WorksheetClosingSectionProps) {
  const showHeadline = !TEMPLATES_SKIP_CLOSING_HEADLINE.has(templateId);
  const lessonChecks = getLessonClosingChecklist(period, templateId);
  const useLessonChecks = lessonChecks.length > 0;
  const checklist = useLessonChecks ? lessonChecks : CLOSING_CHECKLIST;

  return (
    <section className="worksheet-closing ui-card mt-8 overflow-hidden print:border-slate-300 print:bg-white">
      <div className="border-b border-indigo-100/80 bg-indigo-50/40 px-6 py-4">
        <h2 className="text-base font-bold text-slate-900">마무리 · 셀프 점검</h2>
        <p className="mt-1 text-sm text-slate-600">탐구와 글쓰기를 마치며 스스로를 점검해 보세요.</p>
      </div>

      <div className="space-y-6 p-6">
        {showHeadline && !useLessonChecks && (
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">최종 한 줄 결론</h3>
            <p className="mb-3 mt-1 text-sm text-slate-600">
              오늘 탐구·글쓰기에서 발견한 핵심을 한 문장으로 정리하세요.
            </p>
            <input
              type="text"
              className="ui-input !text-base"
              value={v(values, CLOSING_HEADLINE_KEY)}
              disabled={readOnly}
              placeholder="예: 용액은 일정한 성질을 유지하므로 우리 생활에서 믿고 쓸 수 있다."
              onChange={(e) => onChange(CLOSING_HEADLINE_KEY, e.target.value)}
            />
          </div>
        )}

        <div className={showHeadline && !useLessonChecks ? "border-t border-slate-100 pt-6" : ""}>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">셀프 체크</h3>
          <ul className="mt-4 space-y-3">
            {checklist.map(({ key, label }) => (
              <li key={key}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-100 hover:bg-slate-50/80">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
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
    </section>
  );
}
