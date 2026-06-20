import type { Answers } from "@/lib/types";
import { getFieldKeysForTemplate } from "@/lib/templates/field-keys";
import { getTemplateById } from "@/lib/templates/registry";
import { matchUneditedExampleText } from "@/lib/templates/example-texts";
import {
  CLOSING_CHECKLIST,
  CLOSING_HEADLINE_KEY,
  CLOSING_HEADLINE_MIN_CHARS,
} from "@/lib/worksheet-closing/constants";

export const MIN_FIELD_CHARS = 40;
/** 피드백 지원 학습지(동료 피드백 작성 등) 최소 글자수 */
export const MIN_FEEDBACK_FIELD_CHARS = 40;

export function hasKorean(text: string): boolean {
  return /[\uAC00-\uD7A3]/.test(text);
}

export function getMinFieldChars(templateId: string): number {
  const category = getTemplateById(templateId)?.category;
  return category === "feedback-support" ? MIN_FEEDBACK_FIELD_CHARS : MIN_FIELD_CHARS;
}

export function isValidFieldContent(text: string, minChars = MIN_FIELD_CHARS): boolean {
  const trimmed = text.trim();
  return trimmed.length >= minChars && hasKorean(trimmed);
}

export function validateWorksheetValues(
  templateId: string,
  values: Answers,
): { ok: true } | { ok: false; errors: string[] } {
  const fields = getTemplateById(templateId)?.fields ?? getFieldKeysForTemplate(templateId, values);
  if (fields.length === 0) {
    return { ok: false, errors: ["이 템플릿의 입력 항목을 확인할 수 없습니다."] };
  }

  const minChars = getMinFieldChars(templateId);
  const closingCheckKeys = new Set<string>(CLOSING_CHECKLIST.map((c) => c.key));
  const errors: string[] = [];
  for (const key of fields) {
    if (closingCheckKeys.has(key)) continue;

    const text = values[key] ?? "";
    const exampleMatch = matchUneditedExampleText(templateId, key, text);
    if (exampleMatch) {
      errors.push(`「${key}」: 예시 문장을 그대로 붙여 넣었습니다. 내 생각을 담아 다시 작성해 주세요.`);
      continue;
    }

    const fieldMin =
      key === CLOSING_HEADLINE_KEY ? CLOSING_HEADLINE_MIN_CHARS : minChars;
    if (!isValidFieldContent(text, fieldMin)) {
      const len = text.trim().length;
      errors.push(`「${key}」: ${fieldMin}자 이상 한글로 작성해 주세요 (현재 ${len}자)`);
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}
