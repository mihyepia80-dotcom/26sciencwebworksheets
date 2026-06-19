"use client";

import { useEffect } from "react";
import type { TemplateProps } from "@/lib/types";
import { SectionBox } from "@/components/common/Fields";
import { fieldValue as v } from "@/components/templates/utils";
import {
  MANDALART_GRID_KEYS,
  migrateLegacyMandalart,
  type MandalartCellKey,
} from "@/lib/templates/mandalart";

const OUTER_PLACEHOLDER = "관련 키워드";

function GridCell({
  cellKey,
  value,
  onChange,
  readOnly,
}: {
  cellKey: MandalartCellKey;
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
}) {
  const isCenter = cellKey === "center";

  return (
    <textarea
      className={`min-h-[72px] w-full resize-none border border-amber-300 p-2 text-center text-sm leading-snug focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-300 sm:min-h-[84px] ${
        isCenter
          ? "bg-amber-100 font-bold text-amber-900 placeholder:text-amber-700/60"
          : "bg-white text-slate-800 placeholder:text-slate-400"
      }`}
      value={value}
      disabled={readOnly}
      placeholder={isCenter ? "주제" : OUTER_PLACEHOLDER}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function MandalartTemplate({ values, onChange, readOnly }: TemplateProps) {
  useEffect(() => {
    migrateLegacyMandalart(values, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 기존 제출 호환 1회
  }, []);

  return (
    <SectionBox title="사고하기 — 만다라트" color="yellow">
      <div className="rounded-xl border-2 border-amber-200 bg-amber-50/40 p-4">
        <h3 className="mb-3 text-sm font-bold text-amber-900">주제와 관련된 것 찾기</h3>
        <div className="mx-auto max-w-sm overflow-hidden rounded-lg border-2 border-amber-400 bg-amber-200/50">
          <div className="grid grid-cols-3 gap-px bg-amber-300">
            {MANDALART_GRID_KEYS.map((cellKey) => (
              <GridCell
                key={cellKey}
                cellKey={cellKey}
                value={v(values, cellKey)}
                onChange={(val) => onChange(cellKey, val)}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/30 p-4">
        <h3 className="mb-2 text-sm font-bold text-amber-900">
          위에 적은 것을 구체적으로 예를 들어 설명하기
        </h3>
        <label className="mb-1 block text-xs font-semibold text-amber-800">세부내용</label>
        <textarea
          className="mandalart-ruled min-h-[180px] w-full resize-y rounded-lg border border-amber-200 bg-white/90 p-3 text-sm leading-7 text-slate-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-300"
          value={v(values, "details")}
          disabled={readOnly}
          placeholder="위 칸에 적은 내용을 예를 들어 자세히 설명하세요"
          onChange={(e) => onChange("details", e.target.value)}
        />
      </div>
    </SectionBox>
  );
}
