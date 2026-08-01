"use client";

import type { WorksheetMeta } from "@/lib/types";
import { getMetaFieldLabel, getMetaFieldPlaceholder } from "@/lib/meta-labels";

interface WorksheetHeaderProps {
  toolName: string;
  meta: WorksheetMeta;
  onMetaChange: (key: keyof WorksheetMeta, value: string) => void;
  readOnly?: boolean;
}

export function WorksheetHeader({
  toolName,
  meta,
  onMetaChange,
  readOnly = false,
}: WorksheetHeaderProps) {
  const inputCompact = "ui-input-compact !rounded-lg !py-2 !text-base";

  return (
    <header className="worksheet-meta-header">
      <div className="grid grid-cols-1 border-b border-slate-100 md:grid-cols-[6.5rem_1fr_15rem]">
        <div className="meta-label">사고도구</div>
        <div className="meta-value border-slate-100 font-bold md:border-x">{toolName}</div>
        <div className="flex flex-wrap items-center gap-2 bg-slate-50/60 px-4 py-2.5">
          <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">학반</span>
          <input
            className={`${inputCompact} w-12`}
            placeholder="반"
            value={meta.grade}
            disabled={readOnly}
            onChange={(e) => onMetaChange("grade", e.target.value)}
          />
          <input
            className={`${inputCompact} w-12`}
            placeholder="번"
            value={meta.studentNo}
            disabled={readOnly}
            onChange={(e) => onMetaChange("studentNo", e.target.value)}
          />
          <input
            className={`${inputCompact} min-w-[4.5rem] flex-1`}
            placeholder="이름"
            value={meta.studentName}
            disabled={readOnly}
            onChange={(e) => onMetaChange("studentName", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-slate-100 md:grid-cols-[6.5rem_1fr]">
        <div className="meta-label leading-snug">{getMetaFieldLabel("unit")}</div>
        <textarea
          className="ui-textarea min-h-[4.5rem] !rounded-none border-0 px-4 !text-base focus:ring-0"
          placeholder={`${getMetaFieldLabel("unit")}을(를) 입력하세요`}
          rows={2}
          value={meta.unit ?? ""}
          disabled={readOnly}
          onChange={(e) => onMetaChange("unit", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 border-b border-slate-100 md:grid-cols-[6.5rem_1fr]">
        <div className="meta-label leading-snug">{getMetaFieldLabel("topic")}</div>
        <input
          className="ui-input-compact !rounded-none border-0 px-4 focus:ring-0"
          placeholder="주제를 입력하세요"
          value={meta.topic}
          disabled={readOnly}
          onChange={(e) => onMetaChange("topic", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[6.5rem_1fr]">
        <div className="meta-label leading-snug">{getMetaFieldLabel("writingContext")}</div>
        <textarea
          className="ui-textarea min-h-[5.5rem] !rounded-none border-0 px-4 !text-base focus:ring-0"
          placeholder={getMetaFieldPlaceholder("writingContext")}
          rows={3}
          value={meta.writingContext ?? ""}
          disabled={readOnly}
          onChange={(e) => onMetaChange("writingContext", e.target.value)}
        />
      </div>
    </header>
  );
}
