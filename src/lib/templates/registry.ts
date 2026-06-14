import type { TemplateDefinition } from "@/lib/types";

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  { id: "see-think-wonder", order: 0, name: "See/Think/Wonder", nameEn: "SEE/THINK/WONDER", category: "thinking-routine", description: "관찰·생각·궁금증 기록", headerFields: ["unit", "period", "inquiryQuestion", "writingContext"] },
  { id: "circle-tree-map", order: 1, name: "써클맵·트리맵", category: "thinking-map", description: "브레인스토밍과 분류", headerFields: ["writingContext"] },
  { id: "double-bubble-map", order: 2, name: "더블 버블 맵", category: "thinking-map", description: "두 대상 비교·대조", headerFields: ["writingContext"] },
  { id: "multi-flow-map", order: 3, name: "멀티플로우맵", category: "thinking-map", description: "원인·사건·결과 분석", headerFields: ["writingContext"] },
  { id: "bridge-map", order: 4, name: "브릿지맵", category: "thinking-map", description: "유추 관계 표현", headerFields: ["writingContext"] },
  { id: "window-map", order: 5, name: "윈도우맵", category: "thinking-map", description: "9칸 창문 구조 정리", headerFields: ["writingContext"] },
  { id: "swot", order: 6, name: "SWOT 기법", category: "strategy", description: "강점·약점·기회·위협", headerFields: ["writingContext"] },
  { id: "think-puzzle-explore", order: 7, name: "Think·Puzzle·Explore", category: "thinking-routine", description: "알고 있는 것·궁금한 점·탐구", headerFields: ["writingContext"] },
  { id: "hexagon-keywords", order: 8, name: "육각형 핵심 단어 연결하기", category: "thinking-map", description: "키워드와 연결 관계", headerFields: ["writingContext"] },
  { id: "six-thinking-hats", order: 9, name: "육색 사고 기법", category: "strategy", description: "6가지 관점 아이디어", headerFields: ["writingContext", "description"] },
  { id: "claim-support-question", order: 11, name: "Claim·Support·Question", category: "thinking-routine", description: "주장·근거·질문", headerFields: ["writingContext"] },
  { id: "five-why", order: 12, name: "5WHY 활동지", category: "strategy", description: "5번의 왜 질문", headerFields: ["writingContext"] },
  { id: "hot-spots", order: 13, name: "Hot Spots", category: "thinking-routine", description: "사진에서 눈에 띄는 부분", headerFields: ["writingContext"] },
  { id: "headline", order: 14, name: "Headline", category: "thinking-routine", description: "한 문장 헤드라인", headerFields: ["writingContext"] },
  { id: "zoom-in", order: 15, name: "Zoom In", category: "thinking-routine", description: "점진적 이미지 확대 추리", headerFields: ["writingContext"] },
  { id: "chalk-talk", order: 16, name: "Chalk Talk", category: "collaboration", description: "침묵 속 아이디어 공유", headerFields: ["writingContext"] },
  { id: "gsce", order: 17, name: "Generate·Sort·Connect·Elaborate", category: "thinking-routine", description: "아이디어 생성과 구체화", headerFields: ["writingContext"] },
  { id: "frayer-model", order: 18, name: "프레이어 모델", category: "thinking-map", description: "개념 정의·속성·예", headerFields: ["unit", "period", "inquiryQuestion", "writingContext"] },
  { id: "question-types", order: 19, name: "질문의 종류", category: "reflection", description: "사실·개념·호기심 질문", headerFields: ["unit", "period", "inquiryQuestion", "writingContext"] },
  { id: "question-bank", order: 20, name: "질문은행", category: "reflection", description: "4가지 성찰 질문", headerFields: ["description"] },
  { id: "circle-of-viewpoints", order: 21, name: "관점의 원", category: "thinking-routine", description: "다양한 관점 탐색", headerFields: ["writingContext"] },
  { id: "spectrum", order: 22, name: "스펙트럼 입장문", category: "collaboration", description: "입장 스펙트럼 배치", headerFields: ["description"] },
  { id: "honeycomb-questions", order: 23, name: "벌집 질문", category: "thinking-map", description: "5개 육각형 질문", headerFields: ["description"] },
  { id: "compass-points", order: 24, name: "나침반 사고 루틴", category: "thinking-routine", description: "Compass Points", headerFields: ["description"] },
  { id: "plus-one", order: 25, name: "플러스 원", category: "collaboration", description: "Plus One 협력 루틴", headerFields: ["description"] },
  { id: "stop-light", order: 26, name: "STOP Light", category: "thinking-routine", description: "문제·영향·해결", headerFields: ["description"] },
  { id: "y-chart", order: 27, name: "Y Chart", category: "thinking-routine", description: "Looks·Sounds·Feels", headerFields: ["description"] },
  { id: "t-chart", order: 28, name: "T Chart", category: "thinking-routine", description: "알게 된 것·알고 싶은 것", headerFields: ["description"] },
  { id: "four-cs", order: 29, name: "4C's", category: "thinking-routine", description: "연결·도전·개념·변화", headerFields: ["description"] },
  { id: "give-3-feedback", order: 30, name: "Give 3 Feedback", category: "reflection", description: "3가지 피드백", headerFields: ["description"] },
  { id: "ladder-of-feedback", order: 31, name: "Ladder of Feedback", category: "reflection", description: "5단계 피드백 사다리", headerFields: ["description"] },
  { id: "step-inside", order: 32, name: "Step Inside", category: "thinking-routine", description: "대상 속으로 들어가기", headerFields: ["description"] },
  { id: "peel-the-fruit", order: 33, name: "Peel the Fruit", category: "thinking-routine", description: "주제 깊이 탐구", headerFields: ["description"] },
  { id: "i-used-to-think", order: 34, name: "I Used to Think… Now I Think…", category: "reflection", description: "생각의 변화 성찰", headerFields: ["description"] },
  { id: "mandalart", order: 36, name: "만다라트", category: "strategy", description: "9×9 목표 확장", headerFields: ["description"] },
  { id: "brainstorming", order: 37, name: "브레인스토밍", category: "collaboration", description: "4가지 원칙 아이디어", headerFields: ["description"] },
  { id: "brainwriting-635", order: 38, name: "Brainwriting 6-3-5", category: "collaboration", description: "6-3-5 방법", headerFields: ["description"] },
  { id: "exaggeration", order: 39, name: "과장하기", nameEn: "Exaggeration", category: "strategy", description: "과장 질문 기법", headerFields: ["description"] },
  { id: "starbursting", order: 40, name: "스타버스팅 (5W1H)", category: "strategy", description: "5W1H 질문 확장", headerFields: ["description"] },
];

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}

export function getSortedTemplates(): TemplateDefinition[] {
  return [...TEMPLATE_REGISTRY].sort((a, b) => a.order - b.order);
}

export const CATEGORY_LABELS: Record<string, string> = {
  "thinking-routine": "사고 루틴",
  "thinking-map": "생각 지도",
  strategy: "사고 전략",
  reflection: "성찰·피드백",
  collaboration: "협력 활동",
};
