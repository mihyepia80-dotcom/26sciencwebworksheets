const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const nums = (prefix: string, count: number, start = 1) =>
  range(count).map((i) => `${prefix}${start + i}`);
const unders = (prefix: string, count: number) => range(count).map((i) => `${prefix}_${i}`);

function mandalartFields(): string[] {
  const keys = ["center", ...range(8).map((i) => `detail_${i}`)];
  for (let b = 0; b < 9; b++) {
    for (let i = 0; i < 9; i++) {
      if (b !== 4 && i === 4) continue;
      keys.push(`block_${b}_${i}`);
    }
  }
  return keys;
}

function questionBankFields(): string[] {
  return [
    ...unders("self", 5),
    ...unders("process", 4),
    ...unders("concept", 5),
    ...unders("generalize", 4),
  ];
}

const LINK_LETTERS = "ABCDEFGHIJKL".split("").map((l) => `link_${l}`);

export const TEMPLATE_VALUE_FIELDS: Record<string, string[]> = {
  "see-think-wonder": ["see", "think", "wonder"],
  "circle-tree-map": [
    "circleCenter",
    "circleOuter",
    "treeRoot",
    ...nums("treeCat", 3),
    ...nums("treeDetail", 3),
  ],
  "double-bubble-map": [
    ...nums("topUnique", 3),
    "subjectA",
    "subjectB",
    "shared1",
    "shared2",
    ...nums("bottomUnique", 3),
  ],
  "multi-flow-map": [...nums("effect", 3), "event", ...nums("cause", 3)],
  "bridge-map": [
    ...nums("bridgeLabel", 3),
    ...nums("bridgeTop", 3),
    ...nums("bridgeBottom", 3),
  ],
  "window-map": ["tl", "tr", "bl", "br", "center", "left1", "left2", "right1", "right2"],
  swot: ["strength", "weakness", "opportunity", "threat"],
  "think-puzzle-explore": ["think", "puzzle", "explore"],
  "hexagon-keywords": [
    "topLeft",
    "top",
    "topRight",
    "bottomLeft",
    "center",
    "bottomRight",
    "bottom",
    ...LINK_LETTERS,
    "summary",
  ],
  "six-thinking-hats": ["invention", "white1", "yellow", "white2", "red", "blue", "black", "green"],
  "claim-support-question": ["claim", "support", "question"],
  "five-why": ["mainTopic", ...range(5).flatMap((i) => [`q${i + 1}`, `a${i + 1}`]), "conclusion"],
  "hot-spots": ["case1", "case2"],
  headline: ["headline"],
  "zoom-in": ["step1", "step2", "step3", "writingSituation"],
  "chalk-talk": ["writingContext", "activityExample", "activityTip"],
  gsce: ["generate", "sort", "connect", "elaborate", "writingContext", "activityCase"],
  "frayer-model": ["definition", "characteristics", "examples", "nonExamples", "concept"],
  "question-types": ["inquiry", "aiPrompt", "fact", "concept", "curiosity", "expected"],
  "question-bank": questionBankFields(),
  "circle-of-viewpoints": ["centerTopic", "viewpoint", "think", "concern"],
  spectrum: ["question", "notAtAll", "no", "yes", "veryYes", "reflection"],
  "honeycomb-questions": ["left1", "left2", "center", "right1", "right2", "summary"],
  "compass-points": ["needToKnow", "excited", "worries", "steps", "notes"],
  "plus-one": ["workspace", "reflect"],
  "stop-light": [...unders("problem", 6), ...unders("affect", 6), ...unders("solution", 6), "notes"],
  "y-chart": ["looks", "sounds", "feels", "notes"],
  "t-chart": ["know", "want"],
  "four-cs": ["connections", "challenge", "concepts", "changes"],
  "give-3-feedback": ["feedback1", "feedback2", "feedback3"],
  "ladder-of-feedback": ["clarify", "value", "concerns", "suggest", "thank"],
  "step-inside": ["see", "know", "care", "wonder"],
  "peel-the-fruit": ["outside", "under", "building", "connection", "viewpoints", "heart"],
  "i-used-to-think": ["usedToThink", "nowThink"],
  mandalart: mandalartFields(),
  brainstorming: ["idea1", "idea2", "summary"],
  "brainwriting-635": ["issue", ...unders("cell", 18), "connect", "cluster", "evaluate"],
  exaggeration: ["content"],
  starbursting: ["who", "what", "when", "where", "why", "how"],
};

export function getTemplateValueFields(templateId: string): string[] {
  return TEMPLATE_VALUE_FIELDS[templateId] ?? [];
}
