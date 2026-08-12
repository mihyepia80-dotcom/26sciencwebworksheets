import {
  DISSOLUTION_2022_CORE_IDEA,
  DISSOLUTION_2022_ACHIEVEMENT_STANDARDS,
  getDissolutionAchievementTextByLesson,
  getDissolutionLessonCurriculum,
  formatAchievementStandard,
} from "@/lib/curriculum/science-2022-dissolution";
import {
  DISSOLUTION_LESSONS,
  type DissolutionLessonDefinition,
} from "@/lib/worksheet-content/dissolution-lessons";
import { DISSOLUTION_UNIT_PRESETS } from "@/lib/worksheet-content/dissolution-unit";

/** 수업지도안 설계 — 단원·차시별 학습 맥락 */
export interface LessonPeriodPreset {
  period: string;
  /** 표시용 (예: 1차시) */
  lessonLabel?: string;
  learningTopic: string;
  achievementStandards: string;
  /** 2022 개정 성취기준 코드 (예: 6과03-01) */
  achievementStandardId?: string;
  /** 이 차시 목표 성취수준 (A·B·C) */
  targetAchievementLevel?: string;
  inquiryQuestions?: string;
  thinkingTool?: string;
  teachingModel?: string;
  /** 구조 이해 */
  structureUnderstanding?: string;
  /** 사고도구 웹학습지 템플릿 프롬프트 */
  templatePrompt?: string;
  /** Standalone HTML */
  htmlPath?: string;
  templateId?: string;
  /** 연계 탐구 활동 */
  inquiryActivity?: string;
}

export interface LessonUnitDefinition {
  id: string;
  label: string;
  coreIdea: string;
  defaultAchievementStandards: string;
  periodPresets: LessonPeriodPreset[];
  customLabel?: boolean;
}

const DISSOLUTION_CORE_IDEA = DISSOLUTION_2022_CORE_IDEA;

const DISSOLUTION_ACHIEVEMENT_01 = formatAchievementStandard(DISSOLUTION_2022_ACHIEVEMENT_STANDARDS["6과03-01"]);
const DISSOLUTION_ACHIEVEMENT_02 = formatAchievementStandard(DISSOLUTION_2022_ACHIEVEMENT_STANDARDS["6과03-02"]);
const DISSOLUTION_ACHIEVEMENT_03 = formatAchievementStandard(DISSOLUTION_2022_ACHIEVEMENT_STANDARDS["6과03-03"]);

const DISSOLUTION_TEACHING_MODEL_BY_LESSON: Record<number, string> = {
  6: "STS(과학·기술·사회) 융합 개념기반 탐구수업모형",
  7: "STS(과학·기술·사회) 융합 개념기반 탐구수업모형",
  8: "STS(과학·기술·사회) 융합 개념기반 탐구수업모형",
};

function lessonToPeriodPreset(lesson: DissolutionLessonDefinition): LessonPeriodPreset {
  const curriculum = getDissolutionLessonCurriculum(lesson.lessonNumber);
  return {
    period: lesson.period,
    lessonLabel: lesson.periodLabel,
    learningTopic: lesson.learningTopic,
    achievementStandards: getDissolutionAchievementTextByLesson(lesson.lessonNumber),
    achievementStandardId: curriculum?.achievementStandardId,
    targetAchievementLevel: curriculum?.targetLevel,
    inquiryQuestions: lesson.keyQuestion,
    thinkingTool: lesson.thinkingTool,
    teachingModel:
      curriculum?.inquiryStage ??
      DISSOLUTION_TEACHING_MODEL_BY_LESSON[lesson.lessonNumber] ??
      "개념기반 탐구학습",
    structureUnderstanding: lesson.structureUnderstanding,
    templatePrompt: lesson.templatePrompt,
    htmlPath: lesson.htmlPath,
    templateId: lesson.templateId,
    inquiryActivity: curriculum?.inquiryActivity,
  };
}

function buildDissolutionPeriodPresets(): LessonPeriodPreset[] {
  return DISSOLUTION_LESSONS.map(lessonToPeriodPreset);
}

export const LESSON_UNITS: LessonUnitDefinition[] = [
  {
    id: "dissolution-solution",
    label: "3. 용해와 용액",
    coreIdea: DISSOLUTION_CORE_IDEA,
    defaultAchievementStandards: DISSOLUTION_ACHIEVEMENT_01,
    periodPresets: buildDissolutionPeriodPresets(),
  },
  {
    id: "light-lens",
    label: "1. 빛과 렌즈",
    coreIdea: "빛은 직진하며 물체를 비추어 상을 만들고, 렌즈는 빛을 굴절시켜 상을 만든다.",
    defaultAchievementStandards:
      "[6과02-01] 빛의 직진과 렌즈에 의한 상의 형성을 설명할 수 있다. (교과서 성취기준을 확인·수정하세요)",
    periodPresets: [],
  },
  {
    id: "various-gases",
    label: "2. 여러 가지 기체",
    coreIdea: "기체는 공간을 차지하며 무게가 있고, 온도와 압력에 따라 부피와 성질이 변할 수 있다.",
    defaultAchievementStandards:
      "[6과01-01] 기체의 성질을 관찰하고 설명할 수 있다. (교과서 성취기준을 확인·수정하세요)",
    periodPresets: [],
  },
  {
    id: "electricity",
    label: "4. 전기의 이용",
    coreIdea: "전류가 흐르는 회로에서 전기 에너지는 열·빛·소리 등 다른 형태의 에너지로 전환될 수 있다.",
    defaultAchievementStandards:
      "[6과04-01] 전류가 흐르는 회로를 만들고 전기 에너지의 전환을 설명할 수 있다. (교과서 성취기준을 확인·수정하세요)",
    periodPresets: [],
  },
  {
    id: "custom",
    label: "직접 입력",
    coreIdea: "",
    defaultAchievementStandards: "",
    periodPresets: [],
    customLabel: true,
  },
];

export const DEFAULT_LESSON_UNIT_ID = "dissolution-solution";

/** 사고도구 웹학습지 1~8차시 (용해와 용액) */
export { DISSOLUTION_LESSONS, DISSOLUTION_UNIT_PRESETS };

export function getLessonUnit(unitId: string | undefined): LessonUnitDefinition {
  return LESSON_UNITS.find((u) => u.id === unitId) ?? LESSON_UNITS[0];
}

export function resolveUnitLabel(unitId: string, customLabel?: string): string {
  const unit = getLessonUnit(unitId);
  if (unit.customLabel) {
    return customLabel?.trim() || "단원명을 입력하세요";
  }
  return unit.label;
}

export function getPeriodPreset(unitId: string, period: string): LessonPeriodPreset | undefined {
  const unit = getLessonUnit(unitId);
  return unit.periodPresets.find((p) => p.period === period.trim());
}

/** @deprecated use DEFAULT_LESSON_UNIT_ID */
export const CURRENT_UNIT_ID = DEFAULT_LESSON_UNIT_ID;
export const CURRENT_UNIT_LABEL = LESSON_UNITS[0].label;
