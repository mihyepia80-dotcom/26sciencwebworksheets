"use client";

import { useMemo } from "react";
import type { AchievementLevelDescriptor } from "@/lib/curriculum/science-2022-dissolution";
import { useLessonWorksheetContent } from "@/hooks/useDissolutionLessonForm";
import { WorksheetCallout } from "@/components/common/WorksheetUi";
import { CurriculumBanner } from "@/components/worksheet/CurriculumBanner";

export function WorksheetContentBanner({
  templateId,
  period,
}: {
  templateId: string;
  period?: string;
}) {
  const { get, loading } = useLessonWorksheetContent(templateId, period);

  if (loading) return null;

  const unit = get("unit");
  const topic = get("topic");
  const inquiryQuestion = get("inquiryQuestion");
  const structureUnderstanding = get("structureUnderstanding");
  const templatePrompt = get("templatePrompt");
  const writingGuide = get("writingGuide");
  const reminder1 = get("reminder1");
  const reminder2 = get("reminder2");
  const usageTips = get("usageTips");
  const periodLabel = get("periodLabel");
  const coreIdea = get("coreIdea");
  const achievementStandardId = get("achievementStandardId");
  const achievementStandardText = get("achievementStandardText");
  const achievementNotes = get("achievementNotes");
  const inquiryActivity = get("inquiryActivity");
  const inquiryStage = get("inquiryStage");
  const targetAchievementLevel = get("targetAchievementLevel");
  const achievementLevelFocusRaw = get("achievementLevelFocus");
  const levelFocus = useMemo((): AchievementLevelDescriptor[] => {
    if (!achievementLevelFocusRaw?.trim()) return [];
    try {
      const parsed = JSON.parse(achievementLevelFocusRaw) as AchievementLevelDescriptor[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [achievementLevelFocusRaw]);
  const hasReminders = Boolean(reminder1 || reminder2);

  if (
    !unit &&
    !topic &&
    !inquiryQuestion &&
    !structureUnderstanding &&
    !templatePrompt &&
    !writingGuide &&
    !hasReminders &&
    !usageTips
  ) {
    return null;
  }

  return (
    <div className="worksheet-content-banner space-y-4">
      <CurriculumBanner
        coreIdea={coreIdea}
        achievementStandardId={achievementStandardId}
        achievementStandardText={achievementStandardText}
        achievementNotes={achievementNotes}
        inquiryActivity={inquiryActivity}
        inquiryStage={inquiryStage}
        targetLevel={targetAchievementLevel}
        levelFocus={levelFocus}
      />

      {(unit || topic || periodLabel) && (
        <div className="rounded-xl border border-slate-200/90 bg-white px-5 py-4 text-center shadow-sm">
          {unit && (
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {unit}
              {periodLabel ? ` · ${periodLabel}` : ""}
            </p>
          )}
          {topic && <p className="mt-1 text-base font-bold text-slate-900">{topic}</p>}
        </div>
      )}

      {structureUnderstanding && (
        <WorksheetCallout variant="structure" title="구조 이해">
          {structureUnderstanding}
        </WorksheetCallout>
      )}

      {inquiryQuestion && (
        <WorksheetCallout variant="inquiry" title="핵심 질문">
          {inquiryQuestion}
        </WorksheetCallout>
      )}

      {templatePrompt && (
        <WorksheetCallout variant="guide" title="사고도구 프롬프트">
          {templatePrompt}
        </WorksheetCallout>
      )}

      {hasReminders && (
        <WorksheetCallout variant="reminder" title="탐구 리마인더">
          <ul className="list-disc space-y-1 pl-4">
            {reminder1 && <li>{reminder1}</li>}
            {reminder2 && <li>{reminder2}</li>}
          </ul>
        </WorksheetCallout>
      )}

      {writingGuide && (
        <WorksheetCallout variant="guide" title="글쓰기 안내">
          {writingGuide}
        </WorksheetCallout>
      )}

      {usageTips && (
        <WorksheetCallout variant="tip" title="활용 팁">
          {usageTips}
        </WorksheetCallout>
      )}
    </div>
  );
}
