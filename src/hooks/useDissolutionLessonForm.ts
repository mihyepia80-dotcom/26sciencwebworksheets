"use client";

import { useMemo } from "react";
import { useWorksheetContent } from "@/hooks/useWorksheetContent";
import { getDissolutionWorksheetDefaults } from "@/lib/worksheet-content/build-schemas";
import {
  getDissolutionLessonForm,
  getDissolutionLessonFormByTemplate,
  type DissolutionLessonFormConfig,
} from "@/lib/worksheet-content/dissolution-lesson-forms";

export function useDissolutionLessonForm(period?: string, templateId?: string) {
  const form = useMemo((): DissolutionLessonFormConfig | undefined => {
    if (period?.trim()) return getDissolutionLessonForm(period);
    if (templateId) return getDissolutionLessonFormByTemplate(templateId);
    return undefined;
  }, [period, templateId]);

  return form;
}

/** 차시별 기본 문구 + Firebase 오버라이드를 합친 worksheet-content getter */
export function useLessonWorksheetContent(templateId: string, period?: string) {
  const base = useWorksheetContent(templateId);
  const lessonDefaults = useMemo(
    () => (period?.trim() ? getDissolutionWorksheetDefaults(period) : {}),
    [period],
  );

  const get = (key: string): string => {
    const override = base.content[key];
    if (override?.trim()) return override;
    if (lessonDefaults[key]?.trim()) return lessonDefaults[key];
    return base.get(key);
  };

  return { ...base, get };
}
