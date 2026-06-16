import { TEMPLATE_COMPONENTS } from "@/components/templates";
import { TEMPLATE_FIELD_KEYS } from "./field-keys";
import { LEGACY_TEMPLATE_REGISTRY } from "./legacy-registry";
import { TEMPLATE_REGISTRY } from "./registry";

/** 개발 시 템플릿 정의·컴포넌트·필드 키 일치 여부 검증 */
export function validateTemplateRegistry(): string[] {
  const errors: string[] = [];
  const all = [...TEMPLATE_REGISTRY, ...LEGACY_TEMPLATE_REGISTRY];

  for (const def of all) {
    if (!TEMPLATE_COMPONENTS[def.id]) {
      errors.push(`컴포넌트 없음: ${def.id}`);
    }
    const fields = TEMPLATE_FIELD_KEYS[def.id];
    if (!fields?.length) {
      errors.push(`필드 키 없음: ${def.id}`);
    }
  }

  for (const id of Object.keys(TEMPLATE_COMPONENTS)) {
    if (!all.some((t) => t.id === id)) {
      errors.push(`레지스트리에 없는 컴포넌트 id: ${id}`);
    }
  }

  return errors;
}
