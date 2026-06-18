"use client";

import type { WorksheetMeta } from "@/lib/types";
import { getMetaFieldLabel } from "@/lib/meta-labels";

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
  const inputClass =
    "w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
      <div className="grid grid-cols-1 border-b border-slate-200 md:grid-cols-[120px_1fr_200px]">
        <div className="bg-sky-50 px-3 py-2 text-xs font-semibold text-slate-600">사고도구</div>
        <div className="border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 md:border-x">{toolName}</div>
        <div className="flex flex-wrap items-center gap-1 bg-sky-50 px-3 py-2 text-xs">
          <span className="font-semibold text-slate-600">학반</span>
          <input className={`${inputClass} w-12`} placeholder="반" value={meta.grade} disabled={readOnly} onChange={(e) => onMetaChange("grade", e.target.value)} />
          <input className={`${inputClass} w-12`} placeholder="번" value={meta.studentNo} disabled={readOnly} onChange={(e) => onMetaChange("studentNo", e.target.value)} />
          <input className={`${inputClass} flex-1 min-w-[60px]`} placeholder="이름" value={meta.studentName} disabled={readOnly} onChange={(e) => onMetaChange("studentName", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 border-b border-slate-200 md:grid-cols-[120px_1fr]">
        <div className="bg-sky-50 px-3 py-2 text-xs font-semibold text-slate-600">{getMetaFieldLabel("unit")}</div>
        <textarea
          className="min-h-[48px] resize-y px-3 py-2 text-sm focus:outline-none"
          placeholder={`${getMetaFieldLabel("unit")}을(를) 입력하세요`}
          rows={1}
          value={meta.unit ?? ""}
          disabled={readOnly}
          onChange={(e) => onMetaChange("unit", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 border-b border-slate-200 md:grid-cols-[120px_1fr]">
        <div className="bg-sky-50 px-3 py-2 text-xs font-semibold text-slate-600">{getMetaFieldLabel("topic")}</div>
        <input className="px-3 py-2 text-sm focus:outline-none" placeholder="주제를 입력하세요" value={meta.topic} disabled={readOnly} onChange={(e) => onMetaChange("topic", e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[120px_1fr]">
        <div className="bg-sky-50 px-3 py-2 text-xs font-semibold text-slate-600">{getMetaFieldLabel("writingContext")}</div>
        <textarea
          className="min-h-[48px] resize-y px-3 py-2 text-sm focus:outline-none"
          placeholder={`${getMetaFieldLabel("writingContext")}을(를) 입력하세요`}
          rows={2}
          value={meta.writingContext ?? ""}
          disabled={readOnly}
          onChange={(e) => onMetaChange("writingContext", e.target.value)}
        />
      </div>
    </div>
  );
}
