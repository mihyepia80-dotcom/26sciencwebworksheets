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
import type { WorksheetContentFieldDef, WorksheetContentSchema } from "./registry";

const FIELD_HINT_PREFIX = "hint_";

/** 템플릿별 기본값 오버라이드 (코드에 정의된 전용 문구) */
const TEMPLATE_DEFAULT_OVERRIDES: Record<string, Record<string, string>> = {
  "color-symbol-image": {
    unit: CSI_UNIT,
    topic: CSI_TOPIC,
    reminder1: CSI_REMINDERS[0],
    reminder2: CSI_REMINDERS[1],
    writingGuide: CSI_WRITING_GUIDE,
  },
  headline: {
    unit: HEADLINE_UNIT,
    topic: HEADLINE_TOPIC,
    reminder1: HEADLINE_REMINDERS[0],
    reminder2: HEADLINE_REMINDERS[1],
    writingGuide: HEADLINE_GUIDE,
  },
  "claim-support-question": {
    memo1: CSQ_INQUIRY_MEMO[0],
    memo2: CSQ_INQUIRY_MEMO[1],
    ...Object.fromEntries(
      CSQ_SECTIONS.map((s) => [`guide_${s.key}`, s.guide]),
    ),
  },
};

const TEMPLATE_EXTRA_FIELDS: Record<string, WorksheetContentFieldDef[]> = {
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

/** 학습지 본문에 내장된 고정 UI — 공통 배너 생략 */
export const TEMPLATES_WITH_BUILTIN_CONTENT = new Set([
  "color-symbol-image",
  "headline",
  "claim-support-question",
]);

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
