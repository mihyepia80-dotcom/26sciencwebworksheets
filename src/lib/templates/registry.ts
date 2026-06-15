import type { TemplateDefinition, ToolCategory } from "@/lib/types";

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  // 1. 개념 소개 및 탐색 방법
  { id: "think-puzzle-explore", order: 1, name: "Think·Puzzle·Explore", nameEn: "생각하기·퍼즐·탐색하기", category: "concept-exploration", description: "알고 있는 것·궁금한 점·탐구", headerFields: ["writingContext"] },
  { id: "see-think-wonder", order: 2, name: "See/Think/Wonder", nameEn: "보기·생각하기·궁금해하기", category: "concept-exploration", description: "관찰·생각·궁금증 기록", headerFields: ["unit", "period", "inquiryQuestion", "writingContext"] },
  { id: "chalk-talk", order: 3, name: "Chalk Talk", nameEn: "분필 토론", category: "concept-exploration", description: "침묵 속 아이디어 공유", headerFields: ["writingContext"] },
  { id: "zoom-in", order: 4, name: "Zoom In", nameEn: "줌인(확대하기)", category: "concept-exploration", description: "점진적 이미지 확대 추리", headerFields: ["writingContext"] },
  { id: "hot-spots", order: 5, name: "The Explanation Game", nameEn: "설명 게임", category: "concept-exploration", description: "관찰 대상 설명과 추리", headerFields: ["writingContext"] },
  { id: "compass-points", order: 6, name: "Compass Points", nameEn: "나침반 초점", category: "concept-exploration", description: "N·S·E·W 관점 탐색", headerFields: ["description"] },
  { id: "brainstorming", order: 7, name: "브레인스토밍", category: "concept-exploration", description: "4가지 원칙 아이디어", headerFields: ["description"] },
  { id: "brainwriting-635", order: 8, name: "Brainwriting 6-3-5", nameEn: "브레인라이팅", category: "concept-exploration", description: "6-3-5 아이디어 확산", headerFields: ["description"] },
  { id: "starbursting", order: 9, name: "스타버스팅 (5W1H)", category: "concept-exploration", description: "5W1H 질문 확장", headerFields: ["description"] },
  { id: "mandalart", order: 10, name: "만다라트", category: "concept-exploration", description: "9×9 목표·아이디어 확산", headerFields: ["description"] },

  // 2. 개념 종합 및 정리 방법
  { id: "headline", order: 1, name: "Headline", nameEn: "표제 만들기", category: "concept-synthesis", description: "핵심을 한 문장으로", headerFields: ["writingContext"] },
  { id: "four-cs", order: 2, name: "4C's", nameEn: "연결·도전·개념·변화", category: "concept-synthesis", description: "Connections·Challenge·Concepts·Changes", headerFields: ["description"] },
  { id: "i-used-to-think", order: 3, name: "I Used to Think… Now I Think…", nameEn: "예전에는… 지금 생각은?", category: "concept-synthesis", description: "생각의 변화 정리", headerFields: ["description"] },
  { id: "gsce", order: 4, name: "Generate·Sort·Connect·Elaborate", nameEn: "생성·분류·연결·정교화", category: "concept-synthesis", description: "아이디어 생성과 구체화", headerFields: ["writingContext"] },
  { id: "five-why", order: 5, name: "5WHY 활동지", nameEn: "5WHY's", category: "concept-synthesis", description: "5번의 왜 질문", headerFields: ["writingContext"] },
  { id: "six-thinking-hats", order: 6, name: "육색 사고 기법", nameEn: "육색사고모 기법", category: "concept-synthesis", description: "6가지 관점 아이디어", headerFields: ["writingContext", "description"] },
  { id: "circle-tree-map", order: 7, name: "써클맵·트리맵", category: "concept-synthesis", description: "브레인스토밍과 분류", headerFields: ["writingContext"] },
  { id: "double-bubble-map", order: 8, name: "더블 버블 맵", category: "concept-synthesis", description: "두 대상 비교·대조", headerFields: ["writingContext"] },
  { id: "multi-flow-map", order: 9, name: "멀티플로우맵", category: "concept-synthesis", description: "원인·사건·결과 분석", headerFields: ["writingContext"] },
  { id: "bridge-map", order: 10, name: "브릿지맵", category: "concept-synthesis", description: "유추 관계 표현", headerFields: ["writingContext"] },
  { id: "window-map", order: 11, name: "윈도우맵", category: "concept-synthesis", description: "9칸 창문 구조 정리", headerFields: ["writingContext"] },
  { id: "hexagon-keywords", order: 12, name: "육각형 핵심 단어 연결하기", category: "concept-synthesis", description: "키워드와 연결 관계", headerFields: ["writingContext"] },
  { id: "t-chart", order: 13, name: "T Chart", category: "concept-synthesis", description: "알게 된 것·알고 싶은 것", headerFields: ["description"] },
  { id: "y-chart", order: 14, name: "Y Chart", category: "concept-synthesis", description: "Looks·Sounds·Feels", headerFields: ["description"] },
  { id: "swot", order: 15, name: "SWOT 기법", category: "concept-synthesis", description: "강점·약점·기회·위협", headerFields: ["writingContext"] },
  { id: "exaggeration", order: 16, name: "과장하기", nameEn: "SCAMPER·창의 확장", category: "concept-synthesis", description: "과장·변형 질문 기법", headerFields: ["description"] },

  // 3. 개념 심화 방법
  { id: "claim-support-question", order: 1, name: "Claim·Support·Question", nameEn: "주장·근거·질문", category: "concept-deepening", description: "주장·근거·질문", headerFields: ["writingContext"] },
  { id: "circle-of-viewpoints", order: 2, name: "관점의 원", nameEn: "Circle of Viewpoints", category: "concept-deepening", description: "다양한 관점 탐색", headerFields: ["writingContext"] },
  { id: "step-inside", order: 3, name: "Step Inside", nameEn: "안으로 들어가기", category: "concept-deepening", description: "대상 속으로 들어가기", headerFields: ["description"] },
  { id: "stop-light", order: 4, name: "Red·Yellow·Green Light", nameEn: "빨간불·노란불·초록불", category: "concept-deepening", description: "문제·영향·해결", headerFields: ["description"] },
  { id: "peel-the-fruit", order: 5, name: "Peel the Fruit", nameEn: "과일 껍질 벗기기", category: "concept-deepening", description: "주제 깊이 탐구", headerFields: ["description"] },
  { id: "frayer-model", order: 6, name: "프레이어 모델", category: "concept-deepening", description: "개념 정의·속성·예", headerFields: ["unit", "period", "inquiryQuestion", "writingContext"] },
  { id: "honeycomb-questions", order: 7, name: "벌집 질문", nameEn: "질문 시작어", category: "concept-deepening", description: "5개 육각형 질문", headerFields: ["description"] },
  { id: "question-types", order: 8, name: "질문의 종류", category: "concept-deepening", description: "사실·개념·호기심 질문", headerFields: ["unit", "period", "inquiryQuestion", "writingContext"] },
  { id: "spectrum", order: 9, name: "스펙트럼 입장문", nameEn: "줄다리기", category: "concept-deepening", description: "입장 스펙트럼·쟁점 탐색", headerFields: ["description"] },

  // 4. 피드백 지원 방법
  { id: "give-3-feedback", order: 1, name: "Give 3 Feedback", nameEn: "3가지 피드백 루틴", category: "feedback-support", description: "3가지 피드백", headerFields: ["description"] },
  { id: "ladder-of-feedback", order: 2, name: "Ladder of Feedback", nameEn: "피드백의 사다리", category: "feedback-support", description: "5단계 피드백 사다리", headerFields: ["description"] },
  { id: "question-bank", order: 3, name: "질문은행", nameEn: "말하기·묻기·아이디어·제안", category: "feedback-support", description: "4가지 성찰·피드백 질문", headerFields: ["description"] },

  // 5. 자기성찰 방법
  { id: "three-two-one-reflection", order: 1, name: "3-2-1 연결", nameEn: "3-2-1 Bridge", category: "self-reflection", description: "배운 것 3·궁금한 점 2·어려운 점 1", headerFields: ["unit", "inquiryQuestion"] },

  // 6. 학생교류 방법
  { id: "plus-one", order: 1, name: "플러스 원", nameEn: "+1 루틴", category: "student-exchange", description: "Plus One 협력 루틴", headerFields: ["description"] },
];

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}

export function getSortedTemplates(): TemplateDefinition[] {
  return [...TEMPLATE_REGISTRY].sort((a, b) => {
    const catOrder = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (catOrder !== 0) return catOrder;
    return a.order - b.order;
  });
}

export const CATEGORY_ORDER: ToolCategory[] = [
  "concept-exploration",
  "concept-synthesis",
  "concept-deepening",
  "feedback-support",
  "self-reflection",
  "student-exchange",
];

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  "concept-exploration": "개념 소개 및 탐색 방법",
  "concept-synthesis": "개념 종합 및 정리 방법",
  "concept-deepening": "개념 심화 방법",
  "feedback-support": "피드백 지원 방법",
  "self-reflection": "자기성찰 방법",
  "student-exchange": "학생교류 방법",
};

export const CATEGORY_SUBTITLES: Partial<Record<ToolCategory, string>> = {
  "concept-exploration": "수렴적 사고 / 확산적 사고",
};

export function getCategoryGroups() {
  return CATEGORY_ORDER.map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    subtitle: CATEGORY_SUBTITLES[id],
    templates: TEMPLATE_REGISTRY.filter((t) => t.category === id).sort((a, b) => a.order - b.order),
  })).filter((g) => g.templates.length > 0);
}
