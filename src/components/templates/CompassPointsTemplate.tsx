"use client";

import type { TemplateProps } from "@/lib/types";
import { SectionBox } from "@/components/common/Fields";
import { fieldValue as v } from "@/components/templates/utils";
import { COMPASS_POINT_SECTIONS } from "@/lib/templates/compass-points";

function CompassRose() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
      <span className="text-sm font-bold text-slate-700">서</span>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 shadow-md">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <polygon points="12,3 14,12 12,21 10,12" fill="#1e293b" />
          <polygon points="12,3 14,12 12,12 10,12" fill="#f472b6" />
        </svg>
      </div>
      <span className="text-sm font-bold text-slate-700">동</span>
    </div>
  );
}

function CompassTriangle({
  clipPath,
  labelKo,
  labelClass,
  inputClass,
  fieldKey,
  values,
  onChange,
  readOnly,
}: {
  clipPath: string;
  labelKo: string;
  labelClass: string;
  inputClass: string;
  fieldKey: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="absolute inset-0" style={{ clipPath }}>
      <span
        className={`pointer-events-none absolute z-[1] max-w-[46%] text-center text-sm font-bold leading-tight text-pink-700 ${labelClass}`}
      >
        {labelKo}
      </span>
      <textarea
        className={`ui-textarea absolute inset-0 h-full w-full resize-none border-0 bg-transparent text-base leading-relaxed focus:bg-pink-50/40 ${inputClass}`}
        value={v(values, fieldKey)}
        disabled={readOnly}
        placeholder=""
        onChange={(e) => onChange(fieldKey, e.target.value)}
      />
    </div>
  );
}

export function CompassPointsTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="나침반 초점" color="pink">
      <div className="mb-4 overflow-hidden rounded-lg border border-pink-200">
        <table className="w-full text-base">
          <tbody>
            <tr className="border-b border-pink-200 bg-pink-50">
              <th className="w-24 border-r border-pink-200 px-4 py-3 text-left font-bold text-pink-900 sm:w-28">
                설명
              </th>
              <td className="px-4 py-3 text-slate-700">
                새로운 아이디어를 네 방향에서 생각해 보는 사고 루틴입니다.
              </td>
            </tr>
            {COMPASS_POINT_SECTIONS.map((section) => (
              <tr key={section.key} className="border-b border-pink-100 last:border-b-0">
                <th className="border-r border-pink-100 bg-white px-4 py-3 text-left font-semibold text-pink-800">
                  {section.labelKo}
                </th>
                <td className="bg-white px-4 py-3 text-slate-600">{section.prompt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-xl border-4 border-pink-400 bg-white">
        <div className="bg-pink-500 px-4 py-3 text-center">
          <h3 className="text-xl font-bold text-white">나침반 초점</h3>
        </div>
        <p className="border-b border-pink-200 px-4 py-3 text-center text-base text-slate-600">
          새로운 아이디어에 대해 네 방향에서 생각을 적어 봅시다.
        </p>

        <div className="relative mx-auto aspect-square max-w-xl p-4">
          <div className="relative h-full w-full border-2 border-pink-300 bg-white">
            {COMPASS_POINT_SECTIONS.map((section) => (
              <CompassTriangle
                key={section.key}
                clipPath={section.clipPath}
                labelKo={section.labelKo}
                labelClass={section.labelClass}
                inputClass={section.inputClass}
                fieldKey={section.key}
                values={values}
                onChange={onChange}
                readOnly={readOnly}
              />
            ))}

            <svg
              className="pointer-events-none absolute inset-0 h-full w-full text-pink-300"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.6" />
              <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.6" />
            </svg>

            <CompassRose />
          </div>
        </div>
      </div>
    </SectionBox>
  );
}
