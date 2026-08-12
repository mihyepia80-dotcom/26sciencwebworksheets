import type { QbSlots } from "./types";

/** 용해·용액 단원 등에서 자주 쓰이는 어휘 */
const LEXICON = {
  substance: ["설탕", "소금", "용질", "가루", "알갱이", "물질", "티백"],
  medium: ["물", "용액", "비커", "물컵"],
  phenomenon: ["녹", "용해", "진하", "뜨", "가라앉", "섞", "투명", "색", "변"],
  temperature: ["온도", "따뜻", "차갑", "뜨거", "미지근", "끓"],
  amount: ["양", "많", "적", "크", "작", "숟", "스푼", "개"],
  kind: ["종류", "가루"],
  measure: ["무게", "빠르", "느리", "시간", "진하", "높이", "정도", "크기", "양"],
} as const;

export interface QbSlotContext {
  keywords: string[];
  substance?: string;
  medium?: string;
  phenomenon?: string;
  measureHint?: string;
  variableHint?: string;
}

function pickFirst(text: string, terms: readonly string[]): string | undefined {
  return terms.find((t) => text.includes(t));
}

function hasAny(text: string, terms: readonly string[]): boolean {
  return terms.some((t) => text.includes(t));
}

/** 응답에서 핵심 키워드 추출 (최대 5개, AI·조립·대화 공용) */
export function extractKeywords(text: string, max = 5): string[] {
  const t = text.trim();
  if (!t) return [];

  const found: string[] = [];
  const allTerms = [
    ...LEXICON.substance,
    ...LEXICON.medium,
    ...LEXICON.phenomenon,
    ...LEXICON.temperature,
    ...LEXICON.amount,
    ...LEXICON.measure,
    ...LEXICON.kind,
  ];

  for (const term of allTerms) {
    if (t.includes(term) && !found.includes(term)) found.push(term);
    if (found.length >= max) break;
  }
  return found;
}

export function analyzeSlot(text: string): QbSlotContext {
  const t = text.trim();
  const keywords = extractKeywords(t);
  const substance = pickFirst(t, LEXICON.substance);
  const medium = pickFirst(t, LEXICON.medium);
  const phenomenon = pickFirst(t, LEXICON.phenomenon);
  const measureHint = pickFirst(t, LEXICON.measure);

  let variableHint: string | undefined;
  if (hasAny(t, LEXICON.temperature)) variableHint = "물의 온도";
  else if (hasAny(t, LEXICON.amount)) variableHint = "용질의 양";
  else if (substance && hasAny(t, LEXICON.kind)) variableHint = "용질의 종류";
  else if (substance) variableHint = "물의 온도";
  else variableHint = "실험 조건";

  return { keywords, substance, medium, phenomenon, measureHint, variableHint };
}

export function extractKeywordsFromSlots(slots: QbSlots, max = 6): string[] {
  const merged = [
    ...extractKeywords(slots.observed, 4),
    ...extractKeywords(slots.change, 2),
    ...extractKeywords(slots.measure, 2),
  ];
  return [...new Set(merged)].slice(0, max);
}

export function mergeSlotContext(slots: QbSlots): {
  observed: QbSlotContext;
  change: QbSlotContext;
  measure: QbSlotContext;
  keywords: string[];
} {
  return {
    observed: analyzeSlot(slots.observed),
    change: analyzeSlot(slots.change),
    measure: analyzeSlot(slots.measure),
    keywords: extractKeywordsFromSlots(slots),
  };
}

/** 한글 받침 여부 → 조사 선택 */
export function hasJongseong(word: string): boolean {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

export function josa(word: string, pair: readonly [string, string]): string {
  if (!word) return pair[0];
  return word + (hasJongseong(word) ? pair[0] : pair[1]);
}

export function stripObjectParticle(text: string): string {
  return text.trim().replace(/(을|를|이|가|은|는)$/, "");
}
