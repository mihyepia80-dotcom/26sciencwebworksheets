/** 실험반·사고도구 활동지 — 용해와 용액 단원 1~8차시 프리셋 */

import {
  DISSOLUTION_LESSONS,
  getDissolutionLesson,
  getDissolutionLessonByTemplate,
  type DissolutionLessonDefinition,
} from "./dissolution-lessons";

export interface UnitWorksheetPreset {
  period: string;
  templateId: string;
  templateLabel: string;
  fields: Record<string, string>;
}

function lessonToPreset(lesson: DissolutionLessonDefinition): UnitWorksheetPreset {
  return {
    period: lesson.period,
    templateId: lesson.templateId,
    templateLabel: lesson.thinkingTool,
    fields: {
      ...lesson.fields,
      lessonNumber: String(lesson.lessonNumber),
      periodLabel: lesson.periodLabel,
      structureUnderstanding: lesson.structureUnderstanding,
      keyQuestion: lesson.keyQuestion,
      htmlPath: lesson.htmlPath,
    },
  };
}

/** @deprecated DISSOLUTION_LESSONS 사용 권장 */
export const DISSOLUTION_UNIT_PRESETS: UnitWorksheetPreset[] = DISSOLUTION_LESSONS.map(lessonToPreset);

export const THINKING_TOOL_WORKSHEET_HINTS = {
  headerNote:
    "부록 1. 사고 전략 기법 활용 활동지 — 학반·이름·단원·차시·핵심질문·구조 이해·템플릿 프롬프트·활용팁을 확인하세요.",
  screenLayout: "화면구성: 사고도구별 입력 칸과 실험 과정·결과 기록란을 함께 사용합니다.",
} as const;

export function getDissolutionPreset(period: string): UnitWorksheetPreset | undefined {
  const lesson = getDissolutionLesson(period);
  return lesson ? lessonToPreset(lesson) : DISSOLUTION_UNIT_PRESETS.find((p) => p.period === period.trim());
}

export function getDissolutionPresetByTemplate(templateId: string): UnitWorksheetPreset | undefined {
  const lesson = getDissolutionLessonByTemplate(templateId);
  return lesson ? lessonToPreset(lesson) : DISSOLUTION_UNIT_PRESETS.find((p) => p.templateId === templateId);
}

export { DISSOLUTION_LESSONS, getDissolutionLesson, getDissolutionLessonByNumber } from "./dissolution-lessons";
