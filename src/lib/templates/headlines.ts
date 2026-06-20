export const HEADLINE_UNIT = "과학 5학년 2학기 / 3. 용해와 용액 (8차시)";
export const HEADLINE_TOPIC = "일상생활에서 이용하는 용액을 찾아라!";

export const HEADLINE_REMINDERS = [
  "구강 청결제, 식물 영양제, 식초, 손 소독제 등은 모두 우리 일상생활에서 유익하게 사용되는 대표적인 '용액'이다.",
  "용액은 용질이 용매에 가라앉는 것 없이 완벽하고 골고루 용해되어 있기 때문에 성질이 일정하다.",
] as const;

export const HEADLINE_GUIDE =
  "내가 조사한 일상 속 용액 1가지를 선택하고, 그 용액이 우리 삶에 주는 가치와 중요성을 신문 기사의 헤드라인처럼 멋지게 요약해 봅시다.";

export const HEADLINE_CHECKLIST = [
  { key: "checkTerms", label: "핵심 과학 용어(용질, 용매, 용액 등)를 정확하게 사용했는가?" },
  { key: "checkEvidence", label: "나의 주장과 이를 뒷받침하는 구체적인 근거·데이터를 포함했는가?" },
  { key: "checkCausal", label: '문장이 논리적인 인과 구조("~이기 때문이다" 등)로 끝나는가?' },
] as const;

export const HEADLINE_PLACEHOLDERS = {
  headline: "예: '손 소독제, 작은 용액이 지키는 우리의 건강'",
  reason:
    "예: 손 소독제는 알코올(용질)이 물(용매)에 녹아 만든 용액이기 때문에 어디서나 같은 성분과 농도로 살균할 수 있다. …",
} as const;
