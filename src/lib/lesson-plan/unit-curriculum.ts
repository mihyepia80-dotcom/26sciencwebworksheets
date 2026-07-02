import { DISSOLUTION_UNIT_PRESETS } from "@/lib/worksheet-content/dissolution-unit";

/** 수업지도안 설계 — 단원·차시별 학습 맥락 */
export interface LessonPeriodPreset {
  period: string;
  learningTopic: string;
  achievementStandards: string;
  inquiryQuestions?: string;
  thinkingTool?: string;
  teachingModel?: string;
}

export interface LessonUnitDefinition {
  id: string;
  label: string;
  coreIdea: string;
  /** 단원 공통 성취기준 안내(차시별 값이 없을 때) */
  defaultAchievementStandards: string;
  periodPresets: LessonPeriodPreset[];
  /** true면 단원명을 교사가 직접 입력 */
  customLabel?: boolean;
}

const DISSOLUTION_CORE_IDEA =
  "물질은 여러 가지 상태로 존재하며, 구성 입자의 운동에 따라 물질의 상태와 물리적 성질이 변한다.";

const DISSOLUTION_ACHIEVEMENT_01 =
  "[6과03-01] 용해 현상의 의미를 알고, 용질의 종류와 물의 온도에 따라 물에 녹는 용질의 양이 달라짐을 비교할 수 있다.";

const DISSOLUTION_ACHIEVEMENT_02 =
  "[6과03-02] 용질이나 용매의 양에 따라 용액의 진하기가 달라짐을 관찰하고, 용액의 상대적인 진하기를 비교할 수 있다.";

const DISSOLUTION_ACHIEVEMENT_03 =
  "[6과03-03] 일상생활에서 용액이 쓰이는 사례를 조사하여 용액의 필요성을 알리는 자료를 만들고 공유할 수 있다.";

const DISSOLUTION_ACHIEVEMENT_BY_PERIOD: Record<string, string> = {
  "1/12": DISSOLUTION_ACHIEVEMENT_01,
  "2/12": DISSOLUTION_ACHIEVEMENT_01,
  "3/12": DISSOLUTION_ACHIEVEMENT_01,
  "4~5/12": DISSOLUTION_ACHIEVEMENT_01,
  "6~7/12": DISSOLUTION_ACHIEVEMENT_02,
  "8/12": DISSOLUTION_ACHIEVEMENT_03,
  "9~10/12": DISSOLUTION_ACHIEVEMENT_03,
  "11~12/12": DISSOLUTION_ACHIEVEMENT_03,
};

const DISSOLUTION_TEACHING_MODEL_BY_PERIOD: Record<string, string> = {
  "6~7/12": "POE 융합 개념기반 탐구수업모형",
  "8/12": "STS(과학 기술 사회) 융합 개념기반 탐구수업모형",
  "9~10/12": "STS(과학 기술 사회) 융합 개념기반 탐구수업모형",
  "11~12/12": "STS(과학 기술 사회) 융합 개념기반 탐구수업모형",
};

function buildDissolutionPeriodPresets(): LessonPeriodPreset[] {
  const fromWorksheets: LessonPeriodPreset[] = DISSOLUTION_UNIT_PRESETS.map((p) => ({
    period: p.period,
    learningTopic: p.fields.topic ?? "",
    achievementStandards: DISSOLUTION_ACHIEVEMENT_BY_PERIOD[p.period] ?? DISSOLUTION_ACHIEVEMENT_01,
    inquiryQuestions: p.fields.inquiryQuestion,
    thinkingTool: p.templateLabel,
    teachingModel: DISSOLUTION_TEACHING_MODEL_BY_PERIOD[p.period] ?? "개념기반 탐구학습",
  }));

  const extraPeriods: LessonPeriodPreset[] = [
    {
      period: "9~10/12",
      learningTopic: "용액의 필요성을 알리는 디지털 자료 만들기 및 창의적 CSI 성찰 글쓰기",
      achievementStandards: DISSOLUTION_ACHIEVEMENT_03,
      inquiryQuestions: "우리 삶 속 오개념을 바로잡고, 용액이 지닌 과학적 편리성과 필요성을 어떻게 논리적이고 창의적으로 전달할 수 있을까?",
      thinkingTool: "색상, 기호, 이미지 (Color, Symbol, Image)",
      teachingModel: DISSOLUTION_TEACHING_MODEL_BY_PERIOD["9~10/12"],
    },
    {
      period: "11~12/12",
      learningTopic: "용액 연구 직업 탐색 및 대단원 개념 종합 성찰",
      achievementStandards: DISSOLUTION_ACHIEVEMENT_03,
      inquiryQuestions: "용액을 연구하는 직업은 우리 생활에 어떤 도움을 줄까?",
      thinkingTool: "4C (연결-과제-개념-변화)",
      teachingModel: DISSOLUTION_TEACHING_MODEL_BY_PERIOD["11~12/12"],
    },
  ];

  const merged = [...fromWorksheets];
  for (const extra of extraPeriods) {
    if (!merged.some((p) => p.period === extra.period)) {
      merged.push(extra);
    }
  }
  return merged;
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
    defaultAchievementStandards: "[6과02-01] 빛의 직진과 렌즈에 의한 상의 형성을 설명할 수 있다. (교과서 성취기준을 확인·수정하세요)",
    periodPresets: [],
  },
  {
    id: "various-gases",
    label: "2. 여러 가지 기체",
    coreIdea: "기체는 공간을 차지하며 무게가 있고, 온도와 압력에 따라 부피와 성질이 변할 수 있다.",
    defaultAchievementStandards: "[6과01-01] 기체의 성질을 관찰하고 설명할 수 있다. (교과서 성취기준을 확인·수정하세요)",
    periodPresets: [],
  },
  {
    id: "electricity",
    label: "4. 전기의 이용",
    coreIdea: "전류가 흐르는 회로에서 전기 에너지는 열·빛·소리 등 다른 형태의 에너지로 전환될 수 있다.",
    defaultAchievementStandards: "[6과04-01] 전류가 흐르는 회로를 만들고 전기 에너지의 전환을 설명할 수 있다. (교과서 성취기준을 확인·수정하세요)",
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

export function getPeriodPreset(
  unitId: string,
  period: string,
): LessonPeriodPreset | undefined {
  const unit = getLessonUnit(unitId);
  return unit.periodPresets.find((p) => p.period === period.trim());
}

/** @deprecated use DEFAULT_LESSON_UNIT_ID */
export const CURRENT_UNIT_ID = DEFAULT_LESSON_UNIT_ID;
export const CURRENT_UNIT_LABEL = LESSON_UNITS[0].label;
