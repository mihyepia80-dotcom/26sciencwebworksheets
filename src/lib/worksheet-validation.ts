import type { Answers } from "@/lib/types";
import { getTemplateById } from "@/lib/templates/registry";
import { matchUneditedExampleText } from "@/lib/templates/example-texts";

export const MIN_FIELD_CHARS = 150;

export function hasKorean(text: string): boolean {
  return /[\uAC00-\uD7A3]/.test(text);
}

export function isValidFieldContent(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length >= MIN_FIELD_CHARS && hasKorean(trimmed);
}

export function validateWorksheetValues(
  templateId: string,
  values: Answers,
): { ok: true } | { ok: false; errors: string[] } {
  const fields = getTemplateById(templateId)?.fields ?? [];
  if (fields.length === 0) {
    return { ok: false, errors: ["이 템플릿의 입력 항목을 확인할 수 없습니다."] };
  }

  const errors: string[] = [];
  for (const key of fields) {
    const text = values[key] ?? "";
    const exampleMatch = matchUneditedExampleText(templateId, key, text);
    if (exampleMatch) {
      errors.push(`「${key}」: 예시 문장을 그대로 붙여 넣었습니다. 내 생각을 담아 다시 작성해 주세요.`);
      continue;
    }
    if (!isValidFieldContent(text)) {
      const len = text.trim().length;
      errors.push(`「${key}」: 150자 이상 한글로 작성해 주세요 (현재 ${len}자)`);
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
