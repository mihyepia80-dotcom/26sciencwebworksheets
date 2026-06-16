import type { TemplateDefinition } from "@/lib/types";
import { getFieldKeysForTemplate } from "./field-keys";

/** 필드 키를 자동 연결한 완전한 템플릿 정의 반환 */
export function resolveTemplate(def: TemplateDefinition | undefined): TemplateDefinition | undefined {
  if (!def) return undefined;
  return {
    ...def,
    fields: def.fields ?? getFieldKeysForTemplate(def.id),
  };
}

export function resolveTemplates(defs: TemplateDefinition[]): TemplateDefinition[] {
  return defs.map((d) => resolveTemplate(d)!);
}
