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
  const labelClass = "bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600";
  const inputClass = "ui-input !rounded-lg !py-2";

  return (
    <div className="ui-card overflow-hidden">
      <div className="grid grid-cols-1 border-b border-slate-100 md:grid-cols-[7rem_1fr_14rem]">
        <div className={labelClass}>사고도구</div>
        <div className="border-slate-100 px-4 py-3 text-base font-bold text-slate-800 md:border-x">{toolName}</div>
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 px-4 py-3">
          <span className="text-sm font-semibold text-slate-600">학반</span>
          <input className={`${inputClass} w-14`} placeholder="반" value={meta.grade} disabled={readOnly} onChange={(e) => onMetaChange("grade", e.target.value)} />
          <input className={`${inputClass} w-14`} placeholder="번" value={meta.studentNo} disabled={readOnly} onChange={(e) => onMetaChange("studentNo", e.target.value)} />
          <input className={`${inputClass} min-w-[4rem] flex-1`} placeholder="이름" value={meta.studentName} disabled={readOnly} onChange={(e) => onMetaChange("studentName", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-slate-100 md:grid-cols-[9rem_1fr]">
        <div className={`${labelClass} leading-snug`}>{getMetaFieldLabel("unit")}</div>
        <textarea
          className="ui-textarea min-h-[5rem] !rounded-none border-0 px-4 focus:ring-0"
          placeholder={`${getMetaFieldLabel("unit")}을(를) 입력하세요`}
          rows={2}
          value={meta.unit ?? ""}
          disabled={readOnly}
          onChange={(e) => onMetaChange("unit", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 border-b border-slate-100 md:grid-cols-[9rem_1fr]">
        <div className={`${labelClass} leading-snug`}>{getMetaFieldLabel("topic")}</div>
        <input className="ui-input !rounded-none border-0 px-4 focus:ring-0" placeholder="주제를 입력하세요" value={meta.topic} disabled={readOnly} onChange={(e) => onMetaChange("topic", e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[9rem_1fr]">
        <div className={`${labelClass} leading-snug`}>{getMetaFieldLabel("writingContext")}</div>
        <textarea
          className="ui-textarea min-h-[6rem] !rounded-none border-0 px-4 focus:ring-0"
          placeholder={getMetaFieldPlaceholder("writingContext")}
          rows={3}
          value={meta.writingContext ?? ""}
          disabled={readOnly}
          onChange={(e) => onMetaChange("writingContext", e.target.value)}
        />
      </div>
    </div>
  );
}
