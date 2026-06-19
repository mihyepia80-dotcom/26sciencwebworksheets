import type { TemplateDefinition, ToolCategory } from "@/lib/types";
import { CATEGORY_ORDER } from "./categories";

/** 사고 특성 — 유창성·융통성·독창성·정교성 */
export type ThinkingTrait = "유창성" | "융통성" | "독창성" | "정교성";

export interface TemplateCurriculumMeta {
  category: ToolCategory;
  order: number;
  /** 국문 사고기법 명칭 */
  name: string;
  /** 영문 사고기법 명칭 */
  nameEn: string;
  thinkingTraits?: ThinkingTrait[];
  /** 차시별 반영 여부 */
  perLesson?: boolean;
  /** 다른 탐구 단계 목록에도 표시 */
  secondaryCategories?: ToolCategory[];
  /** 보조 탐구 단계에서의 순번 */
  secondaryOrders?: Partial<Record<ToolCategory, number>>;
}

/** 수업 자료 기준 학습지 용어·순번·탐구 단계 (단일 소스) */
export const TEMPLATE_CURRICULUM: Record<string, TemplateCurriculumMeta> = {
  // 󰊱 개념 소개 및 탐색 방법
  "think-puzzle-explore": {
    category: "concept-exploration",
    order: 1,
    name: "생각하기, 퍼즐(수수께끼), 탐색하기",
    nameEn: "Think, Puzzle, Explore",
  },
  "see-think-wonder": {
    category: "concept-exploration",
    order: 2,
    name: "보기(관찰), 생각하기, 궁금해하기",
    nameEn: "See, Think, Wonder",
  },
  "chalk-talk": {
    category: "concept-exploration",
    order: 3,
    name: "분필 토론",
    nameEn: "Chalk Talk",
  },
  "zoom-in": {
    category: "concept-exploration",
    order: 4,
    name: "줌인(확대하기)",
    nameEn: "Zoom In",
  },
  "compass-points": {
    category: "concept-exploration",
    order: 5,
    name: "나침반 초점",
    nameEn: "Compass Points",
  },
  "three-two-one-reflection": {
    category: "concept-exploration",
    order: 6,
    name: "3-2-1 연결",
    nameEn: "3-2-1 Bridge",
    secondaryCategories: ["self-reflection"],
    secondaryOrders: { "self-reflection": 4 },
  },
  brainstorming: {
    category: "concept-exploration",
    order: 7,
    name: "브레인스토밍",
    nameEn: "Brainstorming",
  },
  "brainwriting-635": {
    category: "concept-exploration",
    order: 8,
    name: "브레인라이팅",
    nameEn: "Brainwriting",
  },
  starbursting: {
    category: "concept-exploration",
    order: 9,
    name: "스타버스팅",
    nameEn: "Starbursting",
  },
  mandalart: {
    category: "concept-exploration",
    order: 10,
    name: "만다라트",
    nameEn: "Mandalart",
  },
  fishbone: {
    category: "concept-exploration",
    order: 11,
    name: "피쉬본",
    nameEn: "Fishbone",
  },

  // 󰊲 개념 종합 및 정리 방법
  "color-symbol-image": {
    category: "concept-synthesis",
    order: 1,
    name: "색상, 기호, 이미지",
    nameEn: "Color, Symbol, Image",
  },
  headline: {
    category: "concept-synthesis",
    order: 2,
    name: "표제 만들기",
    nameEn: "Headline",
  },
  "four-cs": {
    category: "concept-synthesis",
    order: 3,
    name: "4C (연결·도전·개념·변화)",
    nameEn: "The 4 C's",
  },
  "i-used-to-think": {
    category: "concept-synthesis",
    order: 4,
    name: "예전에는… 했지만, 지금 생각은?",
    nameEn: "I Used to Think... Now I Think...",
  },
  gsce: {
    category: "concept-synthesis",
    order: 5,
    name: "생성-분류-연결-정교화",
    nameEn: "Generate-Sort-Connect-Elaborate",
  },
  "inquiry-classroom-rules": {
    category: "concept-synthesis",
    order: 6,
    name: "정확한 탐구교실 규칙",
    nameEn: "Inquiry Classroom Rules",
  },
  e3: {
    category: "concept-synthesis",
    order: 7,
    name: "E3 추리-탐구-설명",
    nameEn: "Estimate, Explore, Explain",
  },
  "five-why": {
    category: "concept-synthesis",
    order: 8,
    name: "5WHY's",
    nameEn: "5 Whys",
  },
  scamper: {
    category: "concept-synthesis",
    order: 9,
    name: "스캠퍼",
    nameEn: "SCAMPER",
  },
  "six-thinking-hats": {
    category: "concept-synthesis",
    order: 10,
    name: "육색사고모 기법",
    nameEn: "6 Thinking Hats",
  },

  // 󰊳 개념 심화 방법
  "what-makes-you-say-that": {
    category: "concept-deepening",
    order: 1,
    name: "그렇게 말하는 이유는 무엇인가?",
    nameEn: "What Makes You Say That?",
  },
  "circle-of-viewpoints": {
    category: "concept-deepening",
    order: 2,
    name: "관점의 원",
    nameEn: "Circle of Viewpoints",
  },
  "step-inside": {
    category: "concept-deepening",
    order: 3,
    name: "안으로 들어가기",
    nameEn: "Step Inside",
  },
  "stop-light": {
    category: "concept-deepening",
    order: 4,
    name: "빨간불, 노란불, 초록불",
    nameEn: "Red Light, Yellow Light, Green Light",
  },
  "claim-support-question": {
    category: "concept-deepening",
    order: 5,
    name: "주장, 근거, 질문",
    nameEn: "Claim, Support, Question",
  },
  spectrum: {
    category: "concept-deepening",
    order: 6,
    name: "줄다리기",
    nameEn: "Tug of War",
  },
  "peel-the-fruit": {
    category: "concept-deepening",
    order: 7,
    name: "과일 껍질 벗기기",
    nameEn: "Peel the Fruit",
  },
  "honeycomb-questions": {
    category: "concept-deepening",
    order: 8,
    name: "질문 시작어",
    nameEn: "Question Starts",
  },
  "window-map": {
    category: "concept-deepening",
    order: 9,
    name: "중심, 주변, 비밀",
    nameEn: "Main Side Hidden",
  },
  "frayer-model": {
    category: "concept-deepening",
    order: 10,
    name: "프레이어 모델",
    nameEn: "Frayer Model",
  },

  // 󰊴 피드백 지원 방법
  "give-3-feedback": {
    category: "feedback-support",
    order: 1,
    name: "3가지 피드백 루틴",
    nameEn: "Give 3 - Feedback Routine",
  },
  "ladder-of-feedback": {
    category: "feedback-support",
    order: 2,
    name: "피드백의 사다리",
    nameEn: "Ladder of Feedback",
  },
  "question-bank": {
    category: "feedback-support",
    order: 3,
    name: "말하기·묻기·아이디어·제안",
    nameEn: "Talk · Ask · Ideas · Suggestions",
  },

  // 󰊵 자기성찰 방법
  "traffic-light-reflection": {
    category: "self-reflection",
    order: 2,
    name: "신호등 성찰",
    nameEn: "Traffic Light Reflection",
  },
  "show-of-thumbs-reflection": {
    category: "self-reflection",
    order: 3,
    name: "엄지 표시 성찰",
    nameEn: "Show of Thumbs Reflection",
  },
  "four-cs-reflection": {
    category: "self-reflection",
    order: 5,
    name: "4C 반성",
    nameEn: "The 4 C's Reflection",
  },

  // 󰊶 학생교류 방법
  "give-one-get-one": {
    category: "student-exchange",
    order: 1,
    name: "하나 주고, 하나 받기",
    nameEn: "Give One, Get One",
  },
  "plus-one": {
    category: "student-exchange",
    order: 2,
    name: "+1 루틴",
    nameEn: "+1 Routine",
  },
  "think-talk-open-exchange": {
    category: "student-exchange",
    order: 3,
    name: "생각하기, 말하기, 열린 교류",
    nameEn: "Think Talk Open Exchange",
  },
  "leaderless-discussion": {
    category: "student-exchange",
    order: 4,
    name: "리더 없는 토론",
    nameEn: "The Leaderless Discussion",
  },
  "making-meaning": {
    category: "student-exchange",
    order: 5,
    name: "의미 만들기",
    nameEn: "Making Meaning",
  },
};

export function applyCurriculum(def: TemplateDefinition): TemplateDefinition {
  const meta = TEMPLATE_CURRICULUM[def.id];
  if (!meta) return def;
  return {
    ...def,
    category: meta.category,
    order: meta.order,
    name: meta.name,
    nameEn: meta.nameEn,
    thinkingTraits: meta.thinkingTraits,
    perLesson: meta.perLesson,
    secondaryCategories: meta.secondaryCategories,
    secondaryOrders: meta.secondaryOrders,
  };
}

export function getTemplateOrderInCategory(def: TemplateDefinition, categoryId: ToolCategory): number {
  if (def.category === categoryId) return def.order;
  return def.secondaryOrders?.[categoryId] ?? def.order;
}

export function templateBelongsToCategory(def: TemplateDefinition, categoryId: ToolCategory): boolean {
  if (def.category === categoryId) return true;
  return def.secondaryCategories?.includes(categoryId) ?? false;
}

export function getGlobalSequenceNumber(def: TemplateDefinition): number {
  let offset = 0;
  for (const cat of CATEGORY_ORDER) {
    if (cat === def.category) return offset + def.order;
    const count = Object.values(TEMPLATE_CURRICULUM).filter((m) => m.category === cat).length;
    offset += count;
  }
  return def.order;
}

export function formatTemplateTitle(def: TemplateDefinition): string {
  return def.nameEn ? `${def.name} (${def.nameEn})` : def.name;
}
