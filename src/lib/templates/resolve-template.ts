import type { TemplateDefinition } from "@/lib/types";
import { applyCurriculum } from "./curriculum";
import { getFieldKeysForTemplate } from "./field-keys";

/** 필드 키·수업 용어(curriculum)를 반영한 완전한 템플릿 정의 반환 */
export function resolveTemplate(def: TemplateDefinition | undefined): TemplateDefinition | undefined {
  if (!def) return undefined;
  const withCurriculum = applyCurriculum(def);
  return {
    ...withCurriculum,
    fields: withCurriculum.fields ?? getFieldKeysForTemplate(withCurriculum.id),
  };
}

export function resolveTemplates(defs: TemplateDefinition[]): TemplateDefinition[] {
  return defs.map((d) => resolveTemplate(d)!);
}
