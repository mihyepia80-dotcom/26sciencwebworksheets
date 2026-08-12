import {
  buildObservedQuestion,
  contextualizeProbe,
  getActiveStructuredQuestion,
} from "./chat-flow";
import { containsUnsafeInput } from "./unsafe-terms";
import { assembleInquiryQuestion, buildRuleCandidates } from "./question-assembler";
import type { QbChecklist, QbSlots } from "./types";

export { buildRuleCandidates };

const MEASURABLE_HINTS = [
  "빠르",
  "느리",
  "크기",
  "무게",
  "온도",
  "색",
  "양",
  "높이",
  "개수",
  "시간",
  "길이",
  "속도",
  "진하기",
  "양",
  "정도",
  "변화",
  "차이",
  "비교",
  "측정",
  "관찰",
  "떠오",
  "가라앉",
  "녹",
];

const VAGUE_MEASURES = ["신기", "재미", "느낌", "기분", "좋", "나쁘", "이상"];

export function assembleQuestion(slots: QbSlots): string {
  return assembleInquiryQuestion(slots);
}

export function parseQuestionToSlots(text: string): Partial<QbSlots> {
  const t = text.trim();
  if (!t) return {};

  const changeMeasure = t.match(/^(.+?)를?\s*바꾸면\s*(.+?)은?\(?는\)?\s*어떻게\s*될까\?$/);
  if (changeMeasure) {
    return { change: changeMeasure[1].trim(), measure: changeMeasure[2].trim() };
  }

  const compare = t.match(/^(.+?)일\s*때\s*(.+?)은?\(?는\)?\s*어떻게\s*다를까\?$/);
  if (compare) {
    return { change: compare[1].trim(), measure: compare[2].trim() };
  }

  const relation = t.match(/^(.+?)면\s*(.+?)도\s*달라질까\?$/);
  if (relation) {
    return { change: relation[1].trim(), measure: relation[2].trim() };
  }

  return {};
}

export function evaluateChecklist(slots: QbSlots): QbChecklist {
  const change = slots.change.trim();
  const measure = slots.measure.trim();
  const combined = `${change} ${measure}`;

  const hasVariable = Boolean(change && measure && change !== measure);
  const isTestable = hasVariable && !containsUnsafeInput(combined);
  const isMeasurable =
    hasVariable &&
    !VAGUE_MEASURES.some((v) => measure.includes(v)) &&
    (MEASURABLE_HINTS.some((h) => measure.includes(h)) || measure.length >= 2);

  return { hasVariable, isTestable, isMeasurable };
}

export function computeQuality(checklist: QbChecklist): 0 | 1 | 2 | 3 {
  const score = [checklist.hasVariable, checklist.isTestable, checklist.isMeasurable].filter(Boolean).length;
  return score as 0 | 1 | 2 | 3;
}

export function buildRuleProbe(slots: QbSlots, checklist: QbChecklist): string {
  if (!slots.observed.trim()) {
    return buildObservedQuestion();
  }
  if (!slots.change.trim()) {
    return getActiveStructuredQuestion("change", slots);
  }
  if (!slots.measure.trim()) {
    return getActiveStructuredQuestion("measure", slots);
  }
  if (!checklist.hasVariable) {
    return contextualizeProbe("바꿀 것과 볼 것을 다르게 적어 볼까요?", slots);
  }
  if (!checklist.isMeasurable) {
    return contextualizeProbe("볼 것을 측정·관찰할 수 있게 적어 볼까요?", slots);
  }
  return contextualizeProbe("조건을 더 구체적으로 적어 볼까요?", slots);
}

export function slotsAreComplete(slots: QbSlots): boolean {
  return Boolean(slots.observed.trim() && slots.change.trim() && slots.measure.trim());
}

export function isStuckEligible(slots: QbSlots, checklist: QbChecklist): boolean {
  if (!slots.observed.trim()) return true;
  if (!slots.change.trim() || !slots.measure.trim()) return true;
  return computeQuality(checklist) < 3;
}
