import { buildAllWorksheetContentSchemas } from "./build-schemas";

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

/** 교사가 편집·배포할 수 있는 학습지 고정 텍스트 스키마 (전체 템플릿) */
export const WORKSHEET_CONTENT_SCHEMAS: WorksheetContentSchema[] = buildAllWorksheetContentSchemas();

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
