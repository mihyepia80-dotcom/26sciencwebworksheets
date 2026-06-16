/** 학생 입력 가이드(UX) — 프레이어 모델 등 필드별 안내 */
export const FRAYER_FIELD_GUIDES: Record<string, { student: string; aiRole: string }> = {
  concept: {
    student: "이번 탐구 글쓰기에서 다룰 핵심 키워드를 입력하세요. (예: '용해', '산화', '우성 유전')",
    aiRole: "입력된 키워드가 해당 학년 교육과정 성취기준의 과학 개념어인지 식별합니다.",
  },
  definition: {
    student: "실험 결과를 바탕으로 이 개념을 한 문장으로 정의해 보세요.",
    aiRole: "학생이 쓴 정의에 과학적 오류가 없는지 LLM이 1차 스크리닝합니다.",
  },
  characteristics: {
    student: "이 현상이 일어날 때 눈에 보이는 변화나 규칙, 변인은 무엇인가요?",
    aiRole: "온도 영향, 가역성 등 빠진 핵심 과학적 속성이 있으면 힌트 질문을 던집니다.",
  },
  examples: {
    student: "우리 주변이나 실험에서 이 개념에 해당하는 진짜 예시를 적어보세요.",
    aiRole: "학생이 적은 예시의 과학적 타당성을 검증합니다.",
  },
  nonExamples: {
    student: "이 개념과 비슷해 보이지만, 실제로는 전혀 다른 현상(오개념)은 무엇일까요?",
    aiRole:
      "★AI 핵심: '용해'를 쓰면 \"얼음이 물이 되는 건 '융해'예요. 비예시 칸에 넣어볼까요?\"처럼 추천 칩을 제공합니다.",
  },
};

export const FRAYER_NONEXAMPLE_CHIPS = [
  "용해 ≠ 융해 (얼음→물)",
  "용해 ≠ 혼합 (모래+물)",
  "산화 ≠ 연소만 해당",
  "증발 ≠ 끓음",
];
