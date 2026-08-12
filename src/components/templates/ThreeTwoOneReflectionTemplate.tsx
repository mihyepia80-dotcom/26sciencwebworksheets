"use client";

import type { TemplateProps } from "@/lib/types";
import { SectionBox, TextAreaField } from "@/components/common/Fields";
import { fieldValue as v } from "@/components/templates/utils";

const SECTIONS = [
  {
    key: "learned",
    title: "배운 것 3가지",
    icon: "💡",
    count: 3,
    color: "border-sky-200 bg-sky-50/80",
    placeholder: "이번 탐구에서 배운 내용을 적어보세요",
  },
  {
    key: "curious",
    title: "흥미로웠던 점 2가지",
    icon: "💬",
    count: 2,
    color: "border-rose-200 bg-rose-50/80",
    placeholder: "흥미로웠거나 인상 깊었던 점을 적어보세요",
  },
  {
    key: "difficult",
    title: "아직 궁금한 점 1가지",
    icon: "❓",
    count: 1,
    color: "border-amber-200 bg-amber-50/80",
    placeholder: "아직 더 알고 싶은 점을 적어보세요",
  },
] as const;

export function ThreeTwoOneReflectionTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="3-2-1 연결" color="yellow">
      <div className="mb-4 overflow-hidden rounded-lg border border-yellow-200 text-xs sm:text-sm">
        <div className="grid grid-cols-1 border-b border-yellow-200 bg-yellow-50 md:grid-cols-3">
          <div className="border-yellow-200 p-3 font-bold text-yellow-900 md:border-r">활용팁</div>
          <div className="border-yellow-200 p-3 md:border-r">
            <p className="font-bold text-yellow-900">3-2-1 Bridge 예시</p>
            <p className="mt-1 text-slate-600">
              주제: 기술은 우리의 웰빙에 어떤 영향을 줄까?
              <br />
              수업 전·후에 생각 3, 궁금한 점 2, 연결 1을 비교해 봅니다.
            </p>
          </div>
          <div className="p-3">
            <p className="font-bold text-yellow-900">언제 사용할까요?</p>
            <p className="mt-1 text-slate-600">
              <strong>배우기 전</strong> 첫 생각을 적고, <strong>배운 후</strong> 다시 적어 생각이 어떻게
              바뀌었는지 연결합니다.
            </p>
          </div>
        </div>
      </div>

      <p className="mb-4 text-center text-lg font-bold text-slate-800">3-2-1 성찰</p>

      <div className="space-y-4">
        {SECTIONS.map(({ key, title, icon, count, color, placeholder }) => (
          <div key={key} className={`rounded-xl border-2 p-4 ${color}`}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
              <span aria-hidden>{icon}</span>
              {title}
            </h3>
            <div className="space-y-2">
              {Array.from({ length: count }, (_, i) => {
                const fieldKey = `${key}${i + 1}`;
                return (
                  <label key={fieldKey} className="flex items-start gap-2 text-sm">
                    <span className="mt-2 w-5 shrink-0 font-medium text-slate-500">{i + 1}.</span>
                    <TextAreaField
                      value={v(values, fieldKey)}
                      onChange={(val) => onChange(fieldKey, val)}
                      placeholder={placeholder}
                      rows={4}
                      readOnly={readOnly}
                      className="flex-1"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="rounded-xl border-2 border-dashed border-yellow-300 bg-white p-4">
          <h3 className="mb-2 text-base font-bold text-slate-800">탐구 전후 연결</h3>
          <p className="mb-3 text-base text-slate-600">탐구 전과 후의 생각이 어떻게 연결·변화했는지 적어보세요.</p>
          <TextAreaField
            value={v(values, "selfReflection")}
            onChange={(val) => onChange("selfReflection", val)}
            placeholder="수업 전 생각과 수업 후 생각을 비교해 연결해 보세요"
            rows={6}
            readOnly={readOnly}
          />
        </div>
      </div>
    </SectionBox>
  );
}
