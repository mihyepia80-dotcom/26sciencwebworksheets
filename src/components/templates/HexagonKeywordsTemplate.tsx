"use client";

import { useEffect } from "react";
import type { TemplateProps } from "@/lib/types";
import { SectionBox, TextAreaField } from "@/components/common/Fields";
import { fieldValue as v } from "@/components/templates/utils";
import {
  HEXAGON_EDGES,
  hexagonLinkKey,
  migrateLegacyHexagonLinks,
} from "@/lib/templates/hexagon-keywords";

const CELL_PLACEHOLDER: Record<string, string> = {
  center: "가장 중요한 단어",
  top: "키워드",
  topLeft: "키워드",
  topRight: "키워드",
  bottomLeft: "키워드",
  bottomRight: "키워드",
  bottom: "키워드",
};

function HexCell({
  value,
  onChange,
  readOnly,
  className = "",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <textarea
      className={`hex-cell input-compact resize-none border-2 border-amber-400 bg-white p-3 text-center text-base leading-snug focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-300 ${className}`}
      value={value}
      disabled={readOnly}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function EdgeBadge({ label }: { label: string }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-amber-600 bg-amber-100 text-xs font-bold text-amber-900 shadow-sm">
      {label}
    </span>
  );
}

export function HexagonKeywordsTemplate({ values, onChange, readOnly }: TemplateProps) {
  useEffect(() => {
    migrateLegacyHexagonLinks(values, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 기존 제출 호환 1회
  }, []);

  const sortedEdges = [...HEXAGON_EDGES].sort((a, b) => a.gridOrder - b.gridOrder);

  return (
    <SectionBox title="사고하기 — 육각형 핵심 단어 연결하기" color="yellow">
      <p className="mb-3 text-base text-slate-600">
        주제에서 중요한 키워드를 육각형 칸에 써 보세요.{" "}
        <strong>가운데</strong>에는 가장 중요한 단어를 넣습니다. 각 한글 기호(가~타)는 두
        키워드가 <strong>맞닿는 변</strong>을 뜻합니다.
      </p>

      <div className="relative mx-auto mb-6 h-[300px] w-full max-w-md sm:h-[340px]">
        <div className="grid h-full grid-cols-3 grid-rows-3 place-items-center gap-0">
          <HexCell
            value={v(values, "topLeft")}
            onChange={(val) => onChange("topLeft", val)}
            readOnly={readOnly}
            placeholder={CELL_PLACEHOLDER.topLeft}
          />
          <HexCell
            value={v(values, "top")}
            onChange={(val) => onChange("top", val)}
            readOnly={readOnly}
            placeholder={CELL_PLACEHOLDER.top}
          />
          <HexCell
            value={v(values, "topRight")}
            onChange={(val) => onChange("topRight", val)}
            readOnly={readOnly}
            placeholder={CELL_PLACEHOLDER.topRight}
          />
          <HexCell
            value={v(values, "bottomLeft")}
            onChange={(val) => onChange("bottomLeft", val)}
            readOnly={readOnly}
            placeholder={CELL_PLACEHOLDER.bottomLeft}
          />
          <HexCell
            value={v(values, "center")}
            onChange={(val) => onChange("center", val)}
            readOnly={readOnly}
            className="font-semibold ring-2 ring-amber-300"
            placeholder={CELL_PLACEHOLDER.center}
          />
          <HexCell
            value={v(values, "bottomRight")}
            onChange={(val) => onChange("bottomRight", val)}
            readOnly={readOnly}
            placeholder={CELL_PLACEHOLDER.bottomRight}
          />
          <div />
          <HexCell
            value={v(values, "bottom")}
            onChange={(val) => onChange("bottom", val)}
            readOnly={readOnly}
            placeholder={CELL_PLACEHOLDER.bottom}
          />
          <div />
        </div>

        {HEXAGON_EDGES.map((edge) => (
          <div
            key={edge.label}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: edge.badge.top, left: edge.badge.left }}
          >
            <EdgeBadge label={edge.label} />
          </div>
        ))}
      </div>

      <p className="mb-2 text-xs font-semibold text-amber-900">
        각 한글 기호는 두 단어 사이에 있습니다. 연결성을 써 보세요.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {sortedEdges.map((edge) => (
          <div key={edge.label} className="rounded-lg border border-amber-100 bg-amber-50/50 p-2">
            <div className="mb-1 flex items-center gap-1.5">
              <EdgeBadge label={edge.label} />
              <span className="text-[10px] text-slate-500">{edge.between}</span>
            </div>
            <TextAreaField
              value={v(values, hexagonLinkKey(edge.label))}
              onChange={(val) => onChange(hexagonLinkKey(edge.label), val)}
              rows={2}
              readOnly={readOnly}
              placeholder="두 단어의 연결을 설명하세요"
            />
          </div>
        ))}
      </div>

      <TextAreaField
        label="모둠 친구들과 겹치는 단어로 한 문장 만들기"
        value={v(values, "summary")}
        onChange={(val) => onChange("summary", val)}
        rows={3}
        readOnly={readOnly}
        className="mt-4"
        placeholder="공유한 단어를 바탕으로 한 문장을 완성하세요"
      />
    </SectionBox>
  );
}
