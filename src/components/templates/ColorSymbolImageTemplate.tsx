"use client";

import type { TemplateProps } from "@/lib/types";
import { fieldValue as v } from "@/components/templates/utils";
import { CSI_SECTIONS } from "@/lib/templates/csi";
import { useWorksheetContent } from "@/hooks/useWorksheetContent";

export function ColorSymbolImageTemplate({ values, onChange, readOnly }: TemplateProps) {
  const { get } = useWorksheetContent("color-symbol-image");

  return (
    <div className="csi-worksheet mx-auto max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 print:shadow-none">
        <div className="mb-6 border-b border-slate-200 pb-6 text-center">
          <p className="text-xs font-medium text-slate-500">{get("unit")}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
            색상·기호·이미지(CSI) — 생각 성찰
          </h2>
          <p className="mt-2 text-sm text-slate-600">{get("topic")}</p>
        </div>

        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h3 className="mb-2 text-sm font-bold text-indigo-900">나의 핵심 탐구 지식 리마인더</h3>
          <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-indigo-900/90">
            {get("reminder1") && <li>{get("reminder1")}</li>}
            {get("reminder2") && <li>{get("reminder2")}</li>}
          </ul>
        </div>

        <p className="mb-6 border-l-4 border-indigo-400 pl-3 text-sm leading-relaxed text-slate-700">
          <strong className="text-slate-800">글쓰기 안내.</strong> {get("writingGuide")}
        </p>

        <div className="space-y-6">
          {CSI_SECTIONS.map(
            ({
              badge,
              badgeClass,
              title,
              panelClass,
              focusClass,
              textKey,
              reasonKey,
              question,
              textPlaceholder,
              reasonPlaceholder,
              showColorPicker,
              imageOnly,
            }) => (
              <div key={badge} className={`rounded-xl border p-5 ${panelClass}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-sm px-2 py-0.5 text-xs font-bold text-white ${badgeClass}`}>
                    {badge}
                  </span>
                  <span className="text-sm font-bold text-slate-800 sm:text-base">{title}</span>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-slate-500">{question}</p>

                {imageOnly ? (
                  <textarea
                    className={`w-full resize-y rounded-lg border border-slate-200 p-3 text-sm leading-relaxed text-slate-800 focus:outline-none disabled:bg-slate-50 ${focusClass}`}
                    rows={4}
                    value={v(values, reasonKey)}
                    disabled={readOnly}
                    placeholder={reasonPlaceholder}
                    onChange={(e) => onChange(reasonKey, e.target.value)}
                  />
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex shrink-0 items-start gap-2 sm:w-1/3">
                      {showColorPicker && (
                        <input
                          type="color"
                          className="h-10 w-10 cursor-pointer rounded border border-slate-200 bg-white disabled:opacity-60"
                          value={v(values, "colorPicker") || "#22c55e"}
                          disabled={readOnly}
                          title="색상 선택"
                          onChange={(e) => onChange("colorPicker", e.target.value)}
                        />
                      )}
                      <input
                        type="text"
                        className={`w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none disabled:bg-slate-50 ${focusClass}`}
                        value={v(values, textKey)}
                        disabled={readOnly}
                        placeholder={textPlaceholder}
                        onChange={(e) => onChange(textKey, e.target.value)}
                      />
                    </div>
                    <textarea
                      className={`w-full resize-y rounded-lg border border-slate-200 p-3 text-sm leading-relaxed text-slate-800 focus:outline-none disabled:bg-slate-50 ${focusClass}`}
                      rows={3}
                      value={v(values, reasonKey)}
                      disabled={readOnly}
                      placeholder={reasonPlaceholder}
                      onChange={(e) => onChange(reasonKey, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
