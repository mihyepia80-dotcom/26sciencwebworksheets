import { clip } from "./sanitize";
import { summarizeSlotsForPrompt } from "./question-assembler";
import type { QbRequest } from "./types";

/** 최소 토큰 시스템 프롬프트 */
export const QB_SYSTEM_PROMPT =
  "초5 과학 탐구질문 도우미. 정답·설명 금지. 학생 키워드로 완전한 질문문장 probe(≤30자?)·후보2(≤40자?) JSON만.";

export function buildQbUserMessage(r: QbRequest, unitHint: string, ruleDraft: string): string {
  const stage = !r.slots.observed.trim()
    ? 1
    : !r.slots.change.trim()
      ? 2
      : !r.slots.measure.trim()
        ? 3
        : 4;

  const parts = [
    `S${stage}`,
    clip(unitHint, 12),
    `K:${summarizeSlotsForPrompt(r.slots)}`,
    `관:${clip(r.slots.observed, 36)}`,
    `변:${clip(r.slots.change, 14)}`,
    `볼:${clip(r.slots.measure, 14)}`,
  ];

  if (ruleDraft) parts.push(`초안:${clip(ruleDraft, 36)}`);
  if (r.freeText) parts.push(`막:${clip(r.freeText, 40)}`);

  return parts.join("|");
}

export function buildQbPrompt(r: QbRequest, unitHint: string, ruleDraft = ""): string {
  return `${QB_SYSTEM_PROMPT}\n${buildQbUserMessage(r, unitHint, ruleDraft)}`;
}
