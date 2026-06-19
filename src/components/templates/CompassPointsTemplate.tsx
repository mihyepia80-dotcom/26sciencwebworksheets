"use client";

import type { TemplateProps } from "@/lib/types";
import { SectionBox } from "@/components/common/Fields";
import { fieldValue as v } from "@/components/templates/utils";
import { COMPASS_POINT_SECTIONS } from "@/lib/templates/compass-points";

function CompassRose() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
      <span className="text-[10px] font-bold text-slate-700">W</span>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-pink-500 shadow-md">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <polygon points="12,3 14,12 12,21 10,12" fill="#1e293b" />
          <polygon points="12,3 14,12 12,12 10,12" fill="#f472b6" />
        </svg>
      </div>
      <span className="text-[10px] font-bold text-slate-700">E</span>
    </div>
  );
}

function CompassTriangle({
  clipPath,
  labelEn,
  labelKo,
  labelClass,
  inputClass,
  fieldKey,
  values,
  onChange,
  readOnly,
}: {
  clipPath: string;
  labelEn: string;
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
        className={`pointer-events-none absolute z-[1] max-w-[42%] text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-pink-700 sm:text-[10px] ${labelClass}`}
      >
        <span className="block">{labelEn}</span>
        <span className="mt-0.5 block text-[8px] font-medium normal-case text-pink-600/90 sm:text-[9px]">
          {labelKo}
        </span>
      </span>
      <textarea
        className={`absolute inset-0 h-full w-full resize-none border-0 bg-transparent text-xs leading-relaxed text-slate-800 focus:bg-pink-50/40 focus:outline-none sm:text-sm ${inputClass}`}
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
    <SectionBox title="사고하기 — 나침반 초점 (Compass Points)" color="pink">
      <div className="mb-4 overflow-hidden rounded-lg border border-pink-200">
        <table className="w-full text-xs sm:text-sm">
          <tbody>
            <tr className="border-b border-pink-200 bg-pink-50">
              <th className="w-20 border-r border-pink-200 px-3 py-2 text-left font-bold text-pink-900 sm:w-24">
                설명
              </th>
              <td className="px-3 py-2 text-slate-700">
                새로운 아이디어를 네 방향에서 생각해 보는 사고 루틴입니다.
              </td>
            </tr>
            {COMPASS_POINT_SECTIONS.map((section) => (
              <tr key={section.key} className="border-b border-pink-100 last:border-b-0">
                <th className="border-r border-pink-100 bg-white px-3 py-2 text-left font-semibold text-pink-800">
                  {section.labelEn}
                  <span className="mt-0.5 block text-[10px] font-normal text-pink-600 sm:text-xs">
                    ({section.labelKo})
                  </span>
                </th>
                <td className="bg-white px-3 py-2 text-slate-600">{section.prompt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-xl border-4 border-pink-400 bg-white">
        <div className="bg-pink-500 px-4 py-3 text-center">
          <h3 className="text-lg font-bold tracking-wide text-white sm:text-xl">Compass Points</h3>
        </div>
        <p className="border-b border-pink-200 px-4 py-2 text-center text-xs text-slate-600 sm:text-sm">
          새로운 아이디어에 대해 나침반 초점 사고 루틴으로 브레인스토밍해 봅시다.
        </p>

        <div className="relative mx-auto aspect-square max-w-lg p-3 sm:p-4">
          <div className="relative h-full w-full border-2 border-pink-300 bg-white">
            {COMPASS_POINT_SECTIONS.map((section) => (
              <CompassTriangle
                key={section.key}
                clipPath={section.clipPath}
                labelEn={section.labelEn}
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
