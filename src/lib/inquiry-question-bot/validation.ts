import type { Answers, WorksheetMeta } from "@/lib/types";
import { getTemplateById } from "@/lib/templates/registry";

const INQUIRY_MIN_CHARS = 15;
const PLACEHOLDER_PATTERNS = [/^예:/, /^예\)/, /^무엇을 바꾸면 무엇이 어떻게 될까\?$/];

export function validateInquiryQuestion(
  templateId: string,
  meta: WorksheetMeta,
  values: Answers,
): string | null {
  const template = getTemplateById(templateId);
  if (!template?.questionBot) return null;

  const q = (meta.inquiryQuestion?.trim() || values.inquiryQuestion?.trim() || "").trim();
  if (!q) {
    return "탐구 질문을 만들고 「이 질문으로」를 눌러 확정해 주세요.";
  }
  if (q.length < INQUIRY_MIN_CHARS) {
    return `탐구 질문은 ${INQUIRY_MIN_CHARS}자 이상으로 작성해 주세요 (현재 ${q.length}자).`;
  }
  if (!q.endsWith("?") && !q.endsWith("까")) {
    return "탐구 질문은 물음표(?)로 끝나야 합니다.";
  }
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(q))) {
    return "예시 문구 그대로가 아닌, 나의 탐구 질문을 확정해 주세요.";
  }
  return null;
}
