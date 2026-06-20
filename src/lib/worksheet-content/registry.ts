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
import { CSQ_INQUIRY_MEMO } from "@/lib/templates/csq";

export interface WorksheetContentFieldDef {
  key: string;
  label: string;
  defaultValue: string;
  multiline?: boolean;
}

export interface WorksheetContentSchema {
  templateId: string;
  templateName: string;
  fields: WorksheetContentFieldDef[];
}

/** 교사가 편집·배포할 수 있는 학습지 고정 텍스트 스키마 */
export const WORKSHEET_CONTENT_SCHEMAS: WorksheetContentSchema[] = [
  {
    templateId: "color-symbol-image",
    templateName: "Color, Symbol, Image (CSI)",
    fields: [
      { key: "unit", label: "단원", defaultValue: CSI_UNIT },
      { key: "topic", label: "학습 주제", defaultValue: CSI_TOPIC },
      { key: "reminder1", label: "탐구 리마인더 1", defaultValue: CSI_REMINDERS[0], multiline: true },
      { key: "reminder2", label: "탐구 리마인더 2", defaultValue: CSI_REMINDERS[1], multiline: true },
      { key: "writingGuide", label: "글쓰기 안내", defaultValue: CSI_WRITING_GUIDE, multiline: true },
    ],
  },
  {
    templateId: "headline",
    templateName: "Headline (헤드라인)",
    fields: [
      { key: "unit", label: "단원", defaultValue: HEADLINE_UNIT },
      { key: "topic", label: "학습 주제", defaultValue: HEADLINE_TOPIC },
      { key: "reminder1", label: "탐구 리마인더 1", defaultValue: HEADLINE_REMINDERS[0], multiline: true },
      { key: "reminder2", label: "탐구 리마인더 2", defaultValue: HEADLINE_REMINDERS[1], multiline: true },
      { key: "writingGuide", label: "글쓰기 안내", defaultValue: HEADLINE_GUIDE, multiline: true },
    ],
  },
  {
    templateId: "claim-support-question",
    templateName: "Claim, Support, Question (CSQ)",
    fields: [
      { key: "memo1", label: "탐구 데이터 1", defaultValue: CSQ_INQUIRY_MEMO[0], multiline: true },
      { key: "memo2", label: "탐구 데이터 2", defaultValue: CSQ_INQUIRY_MEMO[1], multiline: true },
    ],
  },
];

export function getWorksheetContentSchema(templateId: string): WorksheetContentSchema | undefined {
  return WORKSHEET_CONTENT_SCHEMAS.find((s) => s.templateId === templateId);
}

export function getDefaultWorksheetContent(templateId: string): Record<string, string> {
  const schema = getWorksheetContentSchema(templateId);
  if (!schema) return {};
  return Object.fromEntries(schema.fields.map((f) => [f.key, f.defaultValue]));
}

export function mergeWorksheetContent(
  templateId: string,
  overrides: Record<string, string> | undefined,
): Record<string, string> {
  const defaults = getDefaultWorksheetContent(templateId);
  if (!overrides) return defaults;
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(overrides)) {
    if (value.trim()) merged[key] = value;
  }
  return merged;
}
