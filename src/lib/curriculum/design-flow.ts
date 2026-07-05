import { DISSOLUTION_UNIT_PRESETS } from "@/lib/worksheet-content/dissolution-unit";
import {
  DEFAULT_LESSON_UNIT_ID,
  getLessonUnit,
  getPeriodPreset,
  LESSON_UNITS,
  resolveUnitLabel,
  type LessonPeriodPreset,
} from "@/lib/lesson-plan/unit-curriculum";

/** ① 사고 활동지 → ② 수업지도안 → ③ 학습지 텍스트 편집 공통 맥락 */
export interface TeachingDesignContext {
  unitId: string;
  unitLabel: string;
  period: string;
  learningTopic: string;
  inquiryQuestion: string;
  achievementStandards: string;
  thinkingTool: string;
  templateId: string;
  templateLabel: string;
}

export type TeachingDesignStep = 1 | 2 | 3;

export const TEACHING_DESIGN_STEPS: {
  step: TeachingDesignStep;
  label: string;
  shortLabel: string;
  path: string;
}[] = [
  { step: 1, label: "사고 활동지", shortLabel: "① 사고 활동지", path: "/teacher/thinking-worksheets" },
  { step: 2, label: "수업지도안 설계", shortLabel: "② 수업지도안", path: "/teacher/lesson-plans" },
  { step: 3, label: "학습지 텍스트 편집", shortLabel: "③ 학습지 텍스트", path: "/teacher/worksheet-content" },
];

export function parseTeachingDesignContext(
  params: URLSearchParams | Record<string, string | null | undefined>,
): TeachingDesignContext {
  const get = (key: string) => {
    const v = params instanceof URLSearchParams ? params.get(key) : params[key];
    return v?.trim() ?? "";
  };

  const unitId = get("unit") || DEFAULT_LESSON_UNIT_ID;
  const customUnitLabel = get("unitLabel");
  const period = get("period") || "1/12";
  const unitLabel = resolveUnitLabel(unitId, customUnitLabel || get("unitName"));
  const lessonPreset = getPeriodPreset(unitId, period);
  const worksheetPreset = DISSOLUTION_UNIT_PRESETS.find((p) => p.period === period);

  const learningTopic = get("topic") || lessonPreset?.learningTopic || worksheetPreset?.fields.topic || "";
  const inquiryQuestion =
    get("inquiry") || lessonPreset?.inquiryQuestions || worksheetPreset?.fields.inquiryQuestion || "";
  const achievementStandards =
    get("achievement") || lessonPreset?.achievementStandards || getLessonUnit(unitId).defaultAchievementStandards;
  const thinkingTool = lessonPreset?.thinkingTool || worksheetPreset?.templateLabel || "";
  const templateId = get("template") || worksheetPreset?.templateId || "";
  const templateLabel = worksheetPreset?.templateLabel || thinkingTool;

  return {
    unitId,
    unitLabel,
    period,
    learningTopic,
    inquiryQuestion,
    achievementStandards,
    thinkingTool,
    templateId,
    templateLabel,
  };
}

export function buildTeachingDesignQuery(ctx: Partial<TeachingDesignContext>): string {
  const q = new URLSearchParams();
  if (ctx.unitId) q.set("unit", ctx.unitId);
  if (ctx.period) q.set("period", ctx.period);
  if (ctx.unitLabel && ctx.unitId === "custom") q.set("unitLabel", ctx.unitLabel);
  if (ctx.learningTopic) q.set("topic", ctx.learningTopic);
  if (ctx.inquiryQuestion) q.set("inquiry", ctx.inquiryQuestion);
  if (ctx.achievementStandards) q.set("achievement", ctx.achievementStandards);
  if (ctx.templateId) q.set("template", ctx.templateId);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function buildTeachingDesignHref(step: TeachingDesignStep, ctx: Partial<TeachingDesignContext>): string {
  const def = TEACHING_DESIGN_STEPS.find((s) => s.step === step);
  return `${def?.path ?? "/teacher"}${buildTeachingDesignQuery(ctx)}`;
}

/** plan 등 추가 쿼리와 설계 맥락을 함께 URL로 만듭니다. */
export function buildTeachingDesignHrefWithExtra(
  step: TeachingDesignStep,
  ctx: Partial<TeachingDesignContext>,
  extra?: Record<string, string | undefined | null>,
): string {
  const stepDef = TEACHING_DESIGN_STEPS.find((s) => s.step === step);
  const path = stepDef?.path ?? "/teacher";
  const q = new URLSearchParams();

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value?.trim()) q.set(key, value.trim());
    }
  }

  const ctxQuery = buildTeachingDesignQuery(ctx);
  if (ctxQuery) {
    const ctxParams = new URLSearchParams(ctxQuery.startsWith("?") ? ctxQuery.slice(1) : ctxQuery);
    ctxParams.forEach((value, key) => {
      if (!q.has(key)) q.set(key, value);
    });
  }

  const serialized = q.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export function getWorksheetPresetForPeriod(unitId: string, period: string) {
  if (unitId !== "dissolution-solution") return undefined;
  return DISSOLUTION_UNIT_PRESETS.find((p) => p.period === period.trim());
}

export function getDesignPresetsForUnit(unitId: string): LessonPeriodPreset[] {
  return getLessonUnit(unitId).periodPresets;
}

export function applyDesignPreset(
  unitId: string,
  period: string,
  customUnitLabel?: string,
): TeachingDesignContext {
  const unitLabel = resolveUnitLabel(unitId, customUnitLabel);
  const lessonPreset = getPeriodPreset(unitId, period);
  const worksheetPreset = getWorksheetPresetForPeriod(unitId, period);

  return {
    unitId,
    unitLabel,
    period,
    learningTopic: lessonPreset?.learningTopic ?? worksheetPreset?.fields.topic ?? "",
    inquiryQuestion: lessonPreset?.inquiryQuestions ?? worksheetPreset?.fields.inquiryQuestion ?? "",
    achievementStandards:
      lessonPreset?.achievementStandards ?? getLessonUnit(unitId).defaultAchievementStandards,
    thinkingTool: lessonPreset?.thinkingTool ?? worksheetPreset?.templateLabel ?? "",
    templateId: worksheetPreset?.templateId ?? "",
    templateLabel: worksheetPreset?.templateLabel ?? lessonPreset?.thinkingTool ?? "",
  };
}

export { LESSON_UNITS, DEFAULT_LESSON_UNIT_ID, getLessonUnit, resolveUnitLabel };
