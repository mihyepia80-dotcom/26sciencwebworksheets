"use client";

import type { AchievementLevelDescriptor } from "@/lib/curriculum/science-2022-dissolution";
import { WorksheetBadge, WorksheetCallout } from "@/components/common/WorksheetUi";

export function CurriculumBanner({
  coreIdea,
  achievementStandardId,
  achievementStandardText,
  achievementNotes,
  inquiryActivity,
  inquiryStage,
  targetLevel,
  levelFocus,
}: {
  coreIdea?: string;
  achievementStandardId?: string;
  achievementStandardText?: string;
  achievementNotes?: string;
  inquiryActivity?: string;
  inquiryStage?: string;
  targetLevel?: string;
  levelFocus?: AchievementLevelDescriptor[];
}) {
  const hasLevels = levelFocus && levelFocus.length > 0;
  const hasContent =
    coreIdea ||
    achievementStandardText ||
    achievementNotes ||
    inquiryActivity ||
    hasLevels;

  if (!hasContent) return null;

  return (
    <div className="curriculum-banner space-y-3">
      {coreIdea && (
        <WorksheetCallout variant="neutral" title="핵심 아이디어 (2022 개정)">
          {coreIdea}
        </WorksheetCallout>
      )}

      {(achievementStandardId || achievementStandardText) && (
        <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-sky-50/60 px-4 py-3.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <WorksheetBadge className="bg-blue-600">성취기준</WorksheetBadge>
            {achievementStandardId && (
              <span className="text-xs font-bold tracking-wide text-blue-800">{achievementStandardId}</span>
            )}
            {targetLevel && (
              <span className="ml-auto rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                이 차시 목표: {targetLevel}수준
              </span>
            )}
          </div>
          {achievementStandardText && (
            <p className="mt-2 text-sm leading-relaxed text-slate-800">{achievementStandardText}</p>
          )}
          {achievementNotes && (
            <p className="mt-2 border-t border-blue-100/80 pt-2 text-xs leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-700">해설 </span>
              {achievementNotes}
            </p>
          )}
        </div>
      )}

      {(inquiryActivity || inquiryStage) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {inquiryActivity && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/80 px-3 py-1.5 text-xs font-medium text-teal-900">
              <span aria-hidden>🔬</span>
              탐구 활동: {inquiryActivity}
            </span>
          )}
          {inquiryStage && (
            <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
              {inquiryStage}
            </span>
          )}
        </div>
      )}

      {hasLevels && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">성취수준 (이 차시)</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {levelFocus!.map((lv) => (
              <li
                key={lv.code}
                className={`rounded-lg border px-3 py-2 text-sm leading-snug ${
                  lv.code === targetLevel
                    ? "border-indigo-300 bg-indigo-50/90 font-medium text-indigo-950 ring-1 ring-indigo-200"
                    : "border-slate-100 bg-slate-50/80 text-slate-700"
                }`}
              >
                <span className="mr-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded bg-slate-200/80 px-1 text-xs font-bold text-slate-700">
                  {lv.code}
                </span>
                <span className="mr-1 text-xs text-slate-500">({lv.label})</span>
                {lv.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
