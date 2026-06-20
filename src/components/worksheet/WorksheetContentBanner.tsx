"use client";

import { useWorksheetContent } from "@/hooks/useWorksheetContent";

export function WorksheetContentBanner({ templateId }: { templateId: string }) {
  const { get, loading } = useWorksheetContent(templateId);

  if (loading) return null;

  const unit = get("unit");
  const topic = get("topic");
  const writingGuide = get("writingGuide");
  const reminder1 = get("reminder1");
  const reminder2 = get("reminder2");
  const hasReminders = Boolean(reminder1 || reminder2);

  if (!unit && !topic && !writingGuide && !hasReminders) return null;

  return (
    <div className="mb-6 space-y-4">
      {(unit || topic) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          {unit && <p className="text-xs font-medium text-slate-500">{unit}</p>}
          {topic && <p className="mt-1 text-sm font-semibold text-slate-800">{topic}</p>}
        </div>
      )}

      {hasReminders && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h3 className="mb-2 text-sm font-bold text-indigo-900">탐구 리마인더</h3>
          <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed text-indigo-900/90">
            {reminder1 && <li>{reminder1}</li>}
            {reminder2 && <li>{reminder2}</li>}
          </ul>
        </div>
      )}

      {writingGuide && (
        <p className="border-l-4 border-indigo-400 pl-3 text-sm leading-relaxed text-slate-700">
          <strong className="text-slate-800">글쓰기 안내.</strong> {writingGuide}
        </p>
      )}
    </div>
  );
}
