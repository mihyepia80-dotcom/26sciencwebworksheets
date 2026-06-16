import type { TemplateDefinition } from "@/lib/types";

/** 기존 제출 호환용 — 홈 목록에는 표시하지 않음 */
export const LEGACY_TEMPLATE_REGISTRY: TemplateDefinition[] = [
  { id: "hot-spots", order: 99, name: "Hot Spots", category: "questioning", description: "사진에서 눈에 띄는 부분", headerFields: ["writingContext"] },
  { id: "compass-points", order: 99, name: "Compass Points", category: "questioning", description: "Compass Points", headerFields: ["description"] },
  { id: "circle-tree-map", order: 99, name: "써클맵·트리맵", category: "generalizing", description: "브레인스토밍과 분류", headerFields: ["writingContext"] },
  { id: "double-bubble-map", order: 99, name: "더블 버블 맵", category: "generalizing", description: "두 대상 비교·대조", headerFields: ["writingContext"] },
  { id: "multi-flow-map", order: 99, name: "멀티플로우맵", category: "generalizing", description: "원인·사건·결과 분석", headerFields: ["writingContext"] },
  { id: "bridge-map", order: 99, name: "브릿지맵", category: "generalizing", description: "유추 관계 표현", headerFields: ["writingContext"] },
  { id: "window-map", order: 99, name: "윈도우맵", category: "generalizing", description: "9칸 창문 구조 정리", headerFields: ["writingContext"] },
  { id: "hexagon-keywords", order: 99, name: "육각형 핵심 단어 연결하기", category: "generalizing", description: "키워드와 연결 관계", headerFields: ["writingContext"] },
  { id: "swot", order: 99, name: "SWOT 기법", category: "generalizing", description: "강점·약점·기회·위협", headerFields: ["writingContext"] },
  { id: "t-chart", order: 99, name: "T Chart", category: "generalizing", description: "알게 된 것·알고 싶은 것", headerFields: ["description"] },
  { id: "y-chart", order: 99, name: "Y Chart", category: "generalizing", description: "Looks·Sounds·Feels", headerFields: ["description"] },
  { id: "peel-the-fruit", order: 99, name: "Peel the Fruit", category: "inquiring", description: "주제 깊이 탐구", headerFields: ["description"] },
  { id: "honeycomb-questions", order: 99, name: "벌집 질문", category: "inquiring", description: "5개 육각형 질문", headerFields: ["description"] },
  { id: "question-types", order: 99, name: "질문의 종류", category: "questioning", description: "사실·개념·호기심 질문", headerFields: ["unit", "period", "inquiryQuestion", "writingContext"] },
  { id: "spectrum", order: 99, name: "스펙트럼 입장문", category: "reflection-exchange", description: "입장 스펙트럼 배치", headerFields: ["description"] },
  { id: "exaggeration", order: 99, name: "과장하기", nameEn: "Exaggeration", category: "transfer", description: "과장 질문 기법", headerFields: ["description"] },
];
