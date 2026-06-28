import type { Answers } from "@/lib/types";
import { appendClosingFieldKeys, isExcludedFromCharCountValidation } from "@/lib/worksheet-closing/constants";
import { defaultDoubleBubbleFieldKeys, doubleBubbleFieldKeys } from "./double-bubble-map";
import { hexagonKeywordFieldKeys } from "./hexagon-keywords";
import { mandalartFieldKeys } from "./mandalart";
import { compassPointFieldKeys } from "./compass-points";

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const nums = (prefix: string, count: number, start = 1) =>
  range(count).map((i) => `${prefix}${start + i}`);
const unders = (prefix: string, count: number) => range(count).map((i) => `${prefix}_${i}`);

export function questionBankFieldKeys(): string[] {
  return [
    ...unders("self", 5),
    ...unders("process", 4),
    ...unders("concept", 5),
    ...unders("generalize", 4),
  ];
}

/** 템플릿 id → 검증 대상 value 필드 키 (단일 소스) */
export const TEMPLATE_FIELD_KEYS: Record<string, string[]> = {
  "see-think-wonder": ["see", "think", "wonder"],
  "three-two-one-reflection": [
    "learned1",
    "learned2",
    "learned3",
    "curious1",
    "curious2",
    "difficult1",
    "selfReflection",
  ],
  "circle-tree-map": [
    "circleCenter",
    "circleOuter",
    "treeRoot",
    ...nums("treeCat", 3),
    ...nums("treeDetail", 3),
  ],
  "double-bubble-map": defaultDoubleBubbleFieldKeys(),
  "multi-flow-map": [...nums("effect", 3), "event", ...nums("cause", 3)],
  "bridge-map": [...nums("bridgeLabel", 3), ...nums("bridgeTop", 3), ...nums("bridgeBottom", 3)],
  "window-map": ["tl", "tr", "bl", "br", "center", "left1", "left2", "right1", "right2"],
  swot: ["strength", "weakness", "opportunity", "threat"],
  "think-puzzle-explore": ["think", "puzzle", "explore"],
  "hexagon-keywords": hexagonKeywordFieldKeys(),
  "six-thinking-hats": ["invention", "white1", "yellow", "white2", "red", "blue", "black", "green"],
  "claim-support-question": ["claim", "support", "question"],
  "five-why": ["mainTopic", ...range(5).flatMap((i) => [`q${i + 1}`, `a${i + 1}`]), "conclusion"],
  "hot-spots": ["case1", "case2"],
  headline: ["headline", "headlineReason"],
  "zoom-in": ["step1", "step2", "step3", "writingSituation"],
  "chalk-talk": ["writingContext", "activityExample", "activityTip"],
  gsce: ["elaborateA", "elaborateB", "elaborateC", "checkTerms", "checkVariable", "checkCausal", "gsceBoard"],
  "frayer-model": ["definition", "characteristics", "examples", "nonExamples", "concept"],
  "question-types": ["inquiry", "aiPrompt", "fact", "concept", "curiosity", "expected"],
  "question-bank": questionBankFieldKeys(),
  "circle-of-viewpoints": ["centerTopic", "viewpoint", "think", "concern"],
  spectrum: ["question", "notAtAll", "no", "yes", "veryYes", "reflection"],
  "honeycomb-questions": ["left1", "left2", "center", "right1", "right2", "summary"],
  "compass-points": compassPointFieldKeys(),
  "plus-one": ["workspace", "reflect"],
  "stop-light": ["draft", "greenLights", "yellowLights", "redLights", "revisionPlan"],
  "y-chart": ["looks", "sounds", "feels", "notes"],
  "t-chart": ["know", "want"],
  "four-cs": ["connections", "challenge", "concepts", "changes"],
  "give-3-feedback": ["feedback1", "feedback2", "feedback3"],
  "ladder-of-feedback": ["clarify", "value", "concerns", "suggest", "thank"],
  "step-inside": ["see", "know", "care", "wonder"],
  "peel-the-fruit": ["outside", "under", "building", "connection", "viewpoints", "heart"],
  "i-used-to-think": ["usedToThink", "nowThink"],
  mandalart: mandalartFieldKeys(),
  brainstorming: ["idea1", "idea2", "summary"],
  "brainwriting-635": ["issue", ...unders("cell", 18), "connect", "cluster", "evaluate"],
  exaggeration: ["content"],
  starbursting: ["who", "what", "when", "where", "why", "how"],
  "what-makes-you-say-that": ["claim", "evidence", "reasoning"],
  e3: ["estimate", "exploreData", "gapAnalysis", "explain"],
  fishbone: ["phenomenon", "cause1", "cause2", "cause3", "cause4", "summary"],
  "color-symbol-image": [
    "colorText",
    "colorPicker",
    "colorReason",
    "symbolText",
    "symbolReason",
    "imageReason",
  ],
  "inquiry-classroom-rules": ["objectiveData", "avoidGuess", "citeEvidence", "selfCheck"],
  scamper: [
    "conclusion",
    "substitute",
    "combine",
    "adapt",
    "modify",
    "putToOtherUse",
    "eliminate",
    "reverse",
  ],
  "traffic-light-reflection": ["green", "yellow", "red", "plan"],
  "show-of-thumbs-reflection": ["difficulty", "engagement", "notes"],
  "four-cs-reflection": ["connections", "challenge", "concepts", "changes"],
  "give-one-get-one": ["give", "get", "notes"],
  "think-talk-open-exchange": ["think", "talk", "exchange"],
  "leaderless-discussion": ["dataPoint", "opinion", "counter", "summary"],
  "making-meaning": ["contribution", "classInsight", "wordCloud"],
};

export function getFieldKeysForTemplate(templateId: string, values?: Answers): string[] {
  let keys: string[];
  if (templateId === "double-bubble-map") {
    keys = doubleBubbleFieldKeys(values ?? {});
  } else {
    keys = TEMPLATE_FIELD_KEYS[templateId] ?? [];
  }
  return appendClosingFieldKeys(templateId, keys);
}

/** 제출 글자수 검증 대상 — 학습지 본문 입력칸만 (마무리·유도 질문 제외) */
export function getBodyFieldKeysForTemplate(templateId: string, values?: Answers): string[] {
  let keys: string[];
  if (templateId === "double-bubble-map") {
    keys = doubleBubbleFieldKeys(values ?? {});
  } else {
    keys = TEMPLATE_FIELD_KEYS[templateId] ?? [];
  }
  return keys.filter((key) => !isExcludedFromCharCountValidation(key));
}
