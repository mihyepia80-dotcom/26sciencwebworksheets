"use client";

import { useEffect } from "react";
import type { TemplateProps } from "@/lib/types";
import { SectionBox } from "@/components/common/Fields";
import { fieldValue as v } from "@/components/templates/utils";
import {
  BUBBLE_COUNTS_KEY,
  DEFAULT_BUBBLE_COUNTS,
  bubbleKey,
  clampBubbleCounts,
  migrateLegacyBubbleValues,
  parseBubbleCounts,
  type BubbleSection,
} from "@/lib/templates/double-bubble-map";

const MAX_BUBBLES = 12;

function BubbleInput({
  value,
  placeholder,
  readOnly,
  sizeClass,
  colorClass,
  onChange,
  onRemove,
  canRemove,
}: {
  value: string;
  placeholder: string;
  readOnly?: boolean;
  sizeClass: string;
  colorClass: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center">
      <textarea
        className={`${sizeClass} input-compact resize-none rounded-full border-2 p-3 text-center text-base leading-snug focus:outline-none focus:ring-2 focus:ring-pink-300 ${colorClass}`}
        value={value}
        disabled={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {!readOnly && canRemove && onRemove && (
        <button
          type="button"
          className="mt-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-red-100 hover:text-red-700"
          onClick={onRemove}
          aria-label="동그라미 삭제"
        >
          삭제
        </button>
      )}
    </div>
  );
}

export function DoubleBubbleMapTemplate({ values, onChange, readOnly }: TemplateProps) {
  const counts = parseBubbleCounts(values);

  useEffect(() => {
    migrateLegacyBubbleValues(values, onChange);
    if (!values[BUBBLE_COUNTS_KEY]) {
      onChange(BUBBLE_COUNTS_KEY, JSON.stringify(DEFAULT_BUBBLE_COUNTS));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 초기 구조만 설정
  }, []);

  const setCounts = (next: Partial<typeof counts>) => {
    onChange(BUBBLE_COUNTS_KEY, JSON.stringify(clampBubbleCounts({ ...counts, ...next })));
  };

  const addBubble = (section: BubbleSection) => {
    const key = section === "shared" ? "shared" : section === "uniqueA" ? "uniqueA" : "uniqueB";
    if (counts[key] >= MAX_BUBBLES) return;
    setCounts({ [key]: counts[key] + 1 });
  };

  const removeBubble = (section: BubbleSection, index: number) => {
    const key = section === "shared" ? "shared" : section === "uniqueA" ? "uniqueA" : "uniqueB";
    if (counts[key] <= 1) return;

    const prefix = bubbleKey(section, 0).replace(/_\d+$/, "_");
    for (let j = index; j < counts[key] - 1; j++) {
      onChange(`${prefix}${j}`, v(values, `${prefix}${j + 1}`));
    }
    onChange(`${prefix}${counts[key] - 1}`, "");
    setCounts({ [key]: counts[key] - 1 });
  };

  const renderBubbleRow = (
    section: BubbleSection,
    count: number,
    placeholder: string,
    sizeClass: string,
    colorClass: string,
  ) => (
    <div className="flex flex-wrap items-start justify-center gap-3">
      {Array.from({ length: count }, (_, i) => (
        <BubbleInput
          key={`${section}-${i}`}
          value={v(values, bubbleKey(section, i))}
          placeholder={placeholder}
          readOnly={readOnly}
          sizeClass={sizeClass}
          colorClass={colorClass}
          canRemove={count > 1}
          onChange={(val) => onChange(bubbleKey(section, i), val)}
          onRemove={() => removeBubble(section, i)}
        />
      ))}
      {!readOnly && count < MAX_BUBBLES && (
        <button
          type="button"
          className={`${sizeClass} flex items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-lg text-slate-400 hover:border-pink-300 hover:text-pink-500`}
          onClick={() => addBubble(section)}
          aria-label="동그라미 추가"
        >
          +
        </button>
      )}
    </div>
  );

  return (
    <SectionBox title="사고하기 — 더블 버블 맵" color="pink">
      <p className="mb-4 text-base text-slate-600">
        두 개념어를 비교·대조하며 개념을 넓혀 가세요. <strong>+</strong>로 동그라미를 추가하고, 필요 없으면{" "}
        <strong>삭제</strong>하세요.
      </p>

      <div className="flex flex-col items-center gap-5">
        <div className="w-full max-w-md">
          <p className="mb-2 text-center text-base font-semibold text-pink-800">첫 번째 개념</p>
          <div className="flex justify-center">
            <BubbleInput
              value={v(values, "subjectA")}
              placeholder="첫 번째 개념"
              readOnly={readOnly}
              sizeClass="h-32 w-32 sm:h-36 sm:w-36 text-lg font-semibold"
              colorClass="border-pink-300 bg-pink-100"
              canRemove={false}
              onChange={(val) => onChange("subjectA", val)}
            />
          </div>
        </div>

        <div className="w-full">
          <p className="mb-2 text-center text-base font-semibold text-pink-700">첫 번째 개념만의 특징</p>
          {renderBubbleRow(
            "uniqueA",
            counts.uniqueA,
            "첫 번째 개념만의 특징",
            "h-24 w-24 sm:h-28 sm:w-28",
            "border-pink-200 bg-pink-50",
          )}
        </div>

        <div className="w-full border-y border-violet-100 py-4">
          <p className="mb-2 text-center text-base font-semibold text-violet-800">공통점</p>
          {renderBubbleRow(
            "shared",
            counts.shared,
            "공통점",
            "h-24 w-24 sm:h-28 sm:w-28",
            "border-violet-200 bg-violet-50",
          )}
        </div>

        <div className="w-full">
          <p className="mb-2 text-center text-base font-semibold text-pink-700">두 번째 개념만의 특징</p>
          {renderBubbleRow(
            "uniqueB",
            counts.uniqueB,
            "두 번째 개념만의 특징",
            "h-24 w-24 sm:h-28 sm:w-28",
            "border-pink-200 bg-pink-50",
          )}
        </div>

        <div className="w-full max-w-md">
          <p className="mb-2 text-center text-base font-semibold text-pink-800">두 번째 개념</p>
          <div className="flex justify-center">
            <BubbleInput
              value={v(values, "subjectB")}
              placeholder="두 번째 개념"
              readOnly={readOnly}
              sizeClass="h-32 w-32 sm:h-36 sm:w-36 text-lg font-semibold"
              colorClass="border-pink-300 bg-pink-100"
              canRemove={false}
              onChange={(val) => onChange("subjectB", val)}
            />
          </div>
        </div>
      </div>
    </SectionBox>
  );
}
