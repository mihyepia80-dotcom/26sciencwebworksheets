import { getFieldKeysForTemplate } from "@/lib/templates/field-keys";
import { formatTemplateTitle } from "@/lib/templates/curriculum";
import { getSortedTemplates } from "@/lib/templates/registry";
import {
  CSI_REMINDERS,
  CSI_TOPIC,
  CSI_UNIT,
  CSI_WRITING_GUIDE,
} from "@/lib/templates/csi";
import {
  HEADLINE_GUIDE,
  HEADLINE_REMINDERS,
  HEADLINE_TOPIC,
  HEADLINE_UNIT,
} from "@/lib/templates/headlines";
import { CSQ_INQUIRY_MEMO, CSQ_SECTIONS } from "@/lib/templates/csq";
import {
  DISSOLUTION_2022_CORE_IDEA,
  getDissolutionAchievementStandard,
  getDissolutionLessonCurriculum,
} from "@/lib/curriculum/science-2022-dissolution";
import { DISSOLUTION_LESSONS, getDissolutionLesson } from "@/lib/worksheet-content/dissolution-lessons";
import { getDissolutionPresetByTemplate } from "@/lib/worksheet-content/dissolution-unit";
import type { WorksheetContentFieldDef, WorksheetContentSchema } from "./registry";

const FIELD_HINT_PREFIX = "hint_";

const DISSOLUTION_LESSON_FIELD_OVERRIDES = Object.fromEntries(
  DISSOLUTION_LESSONS.map((lesson) => [lesson.period, lesson.fields]),
);

export function getDissolutionWorksheetDefaults(period: string): Record<string, string> {
  const lesson = getDissolutionLesson(period.trim());
  if (!lesson) return DISSOLUTION_LESSON_FIELD_OVERRIDES[period.trim()] ?? {};
  const curriculum = getDissolutionLessonCurriculum(lesson.lessonNumber);
  const standard = curriculum
    ? getDissolutionAchievementStandard(curriculum.achievementStandardId)
    : undefined;
  return {
    ...lesson.fields,
    structureUnderstanding: lesson.structureUnderstanding,
    templatePrompt: lesson.templatePrompt,
    inquiryQuestion: lesson.keyQuestion,
    periodLabel: lesson.periodLabel,
    lessonNumber: String(lesson.lessonNumber),
    coreIdea: DISSOLUTION_2022_CORE_IDEA,
    achievementStandardId: curriculum?.achievementStandardId ?? "",
    achievementStandardText: standard?.text ?? "",
    achievementNotes: standard?.notes.join(" ") ?? "",
    inquiryActivity: curriculum?.inquiryActivity ?? "",
    inquiryStage: curriculum?.inquiryStage ?? "",
    targetAchievementLevel: curriculum?.targetLevel ?? "",
    achievementLevelFocus: curriculum?.levelFocus
      ? JSON.stringify(curriculum.levelFocus)
      : "",
  };
}

/** 템플릿별 기본값 오버라이드 (코드에 정의된 전용 문구) */
const TEMPLATE_DEFAULT_OVERRIDES: Record<string, Record<string, string>> = {
  "color-symbol-image": {
    ...(DISSOLUTION_LESSONS.find((l) => l.templateId === "color-symbol-image")?.fields ?? {}),
    unit: CSI_UNIT,
    topic: DISSOLUTION_LESSONS.find((l) => l.lessonNumber === 7)?.fields.topic ?? CSI_TOPIC,
    reminder1: CSI_REMINDERS[0],
    reminder2: CSI_REMINDERS[1],
    writingGuide:
      DISSOLUTION_LESSONS.find((l) => l.lessonNumber === 7)?.fields.writingGuide ?? CSI_WRITING_GUIDE,
  },
  headline: {
    ...(DISSOLUTION_LESSONS.find((l) => l.templateId === "headline")?.fields ?? {}),
    unit: HEADLINE_UNIT,
    topic: DISSOLUTION_LESSONS.find((l) => l.lessonNumber === 6)?.fields.topic ?? HEADLINE_TOPIC,
    reminder1: HEADLINE_REMINDERS[0],
    reminder2: HEADLINE_REMINDERS[1],
    writingGuide:
      DISSOLUTION_LESSONS.find((l) => l.lessonNumber === 6)?.fields.writingGuide ?? HEADLINE_GUIDE,
  },
  "claim-support-question": {
    ...(DISSOLUTION_LESSONS.find((l) => l.templateId === "claim-support-question")?.fields ?? {}),
    memo1: CSQ_INQUIRY_MEMO[0],
    memo2: CSQ_INQUIRY_MEMO[1],
    ...Object.fromEntries(CSQ_SECTIONS.map((s) => [`guide_${s.key}`, s.guide])),
  },
  ...Object.fromEntries(
    ["see-think-wonder", "i-used-to-think", "e3", "four-cs"].map((id) => {
      const lesson = DISSOLUTION_LESSONS.find((l) => l.templateId === id);
      return lesson ? [id, lesson.fields] : [id, {}];
    }),
  ),
};

const TEMPLATE_EXTRA_FIELDS: Record<string, WorksheetContentFieldDef[]> = {
  gsce: [
    { key: "intro", label: "활동지 도입", defaultValue: "", multiline: true },
    { key: "step1Guide", label: "1단계 생성 안내", defaultValue: "", multiline: true },
    { key: "step2Guide", label: "2~3단계 분류·연결 안내", defaultValue: "", multiline: true },
    { key: "step4Guide", label: "4단계 정교화 안내", defaultValue: "", multiline: true },
  ],
  "claim-support-question": [
    { key: "memo1", label: "탐구 데이터 1", defaultValue: CSQ_INQUIRY_MEMO[0], multiline: true },
    { key: "memo2", label: "탐구 데이터 2", defaultValue: CSQ_INQUIRY_MEMO[1], multiline: true },
    ...CSQ_SECTIONS.map((s) => ({
      key: `guide_${s.key}`,
      label: `${s.title} 안내`,
      defaultValue: s.guide,
      multiline: true,
    })),
  ],
};

/** 학습지 본문에 내장된 고정 UI — 공통 배너 생략 (GSCE 등 자체 안내가 있는 템플릿만) */
export const TEMPLATES_WITH_BUILTIN_CONTENT = new Set(["gsce"]);

function standardFields(
  templateId: string,
  description: string,
  aiFeature?: string,
): WorksheetContentFieldDef[] {
  const overrides = TEMPLATE_DEFAULT_OVERRIDES[templateId] ?? {};
  return [
    { key: "unit", label: "단원", defaultValue: overrides.unit ?? "" },
    { key: "topic", label: "학습 주제", defaultValue: overrides.topic ?? description },
    {
      key: "inquiryQuestion",
      label: "탐구 질문",
      defaultValue: overrides.inquiryQuestion ?? "",
      multiline: true,
    },
    {
      key: "writingGuide",
      label: "글쓰기 안내",
      defaultValue: overrides.writingGuide ?? aiFeature ?? description,
      multiline: true,
    },
    {
      key: "reminder1",
      label: "탐구 리마인더 1",
      defaultValue: overrides.reminder1 ?? "",
      multiline: true,
    },
    {
      key: "reminder2",
      label: "탐구 리마인더 2",
      defaultValue: overrides.reminder2 ?? "",
      multiline: true,
    },
    {
      key: "usageTips",
      label: "활용 팁",
      defaultValue: overrides.usageTips ?? "",
      multiline: true,
    },
    {
      key: "structureUnderstanding",
      label: "구조 이해",
      defaultValue: overrides.structureUnderstanding ?? "",
      multiline: true,
    },
    {
      key: "templatePrompt",
      label: "사고도구 템플릿 프롬프트",
      defaultValue: overrides.templatePrompt ?? "",
      multiline: true,
    },
  ];
}

function fieldHintFields(templateId: string): WorksheetContentFieldDef[] {
  const keys = getFieldKeysForTemplate(templateId);
  const closingPrefixes = ["closing", "guided_q_"];
  return keys
    .filter(
      (key) =>
        !closingPrefixes.some((p) => key.startsWith(p)) &&
        !key.startsWith("hint_"),
    )
    .map((key) => ({
      key: `${FIELD_HINT_PREFIX}${key}`,
      label: `입력 안내: ${key}`,
      defaultValue: "",
      multiline: true,
    }));
}

/** 44종 전체 학습지 편집 스키마 생성 */
export function buildAllWorksheetContentSchemas(): WorksheetContentSchema[] {
  return getSortedTemplates().map((template) => {
    const extra = TEMPLATE_EXTRA_FIELDS[template.id] ?? [];
    const base = standardFields(template.id, template.description, template.aiFeature);
    const mergedKeys = new Set(base.map((f) => f.key));
    const uniqueExtra = extra.filter((f) => !mergedKeys.has(f.key));

    return {
      templateId: template.id,
      templateName: formatTemplateTitle(template),
      fields: [...base, ...uniqueExtra, ...fieldHintFields(template.id)],
    };
  });
}

export function getFieldHintKey(fieldKey: string): string {
  return `${FIELD_HINT_PREFIX}${fieldKey}`;
}
