/** 학생이 그대로 붙여 넣으면 제출 불가인 예시·가이드·placeholder 문구 */

const SEE_THINK_WONDER_GUIDES = [
  "(무엇)이 보인다.",
  "(변화나 특정한 규칙)이 보인다.",
  "(물체의 생김새나 특징)이 보인다.",
  "(어떤 성질을 가지고 있는지) 알 수 있다.",
  "(특정한 부분들) 발견하였다.",
  "(인물의 제스처나 감정)이 보인다.",
  "(대상들끼리의 공통점/차이점)이 보인다.",
  "내 생각에 이것은 ~ 의미일 것 같다.",
  "내가 추측하기로는 ~ 것 같다.",
  "내가 이해하기로는 ~ 것 같다.",
  "내가 해석하기에는 ~ 의미일 것 같다.",
  "가장 인상깊었던 점은 ~ 이었다.",
  "왜 이런지 궁금하다.",
  "만약 ~ 한다면?",
  "왜 이렇게 했을까?",
  "나는 ~점이 궁금하다.",
  "이 둘은 어떤 관련이 있을까?",
  "어떤 의미가 담겼을까?",
  "어떤 영향을 미칠까?",
  "~가 가능한 이유는 무엇일까?",
];

const THINK_PUZZLE_EXPLORE_EXAMPLES = [
  "예: '나는 ___에 대해 이런 것을 알고 있어요.'",
  "예: '나는 ___이 왜 그런지 궁금해요.'",
  "예: '책을 찾아보거나 선생님께 물어보고 싶어요.'",
];

const FRAYER_NONEXAMPLE_CHIPS = [
  "용해 ≠ 융해 (얼음→물)",
  "용해 ≠ 혼합 (모래+물)",
  "산화 ≠ 연소만 해당",
  "증발 ≠ 끓음",
];

const COMMON_PLACEHOLDERS = [
  "관찰한 내용을 적어보세요",
  "생각과 느낌을 적어보세요",
  "궁금한 점을 적어보세요",
  "탐구 전후로 기억에 남는 과학 단어를 적어보세요",
  "탐구를 통해 바뀐 질문을 적어보세요",
  "이번 탐구를 한 문장 비유로 연결해 보세요",
  "탐구 전과 후의 생각이 어떻게 연결되었는지 적어보세요",
  "생각을 자유롭게 기록하세요",
  "예: '모인 물방울이 지구를 구한다!'",
  "나는 여기가 눈에 띄었어요. 왜냐하면…",
  "과장된 질문과 아이디어를 적어보세요",
  "퇴고할 탐구 글 초고를 붙여 넣거나 작성하세요",
  "데이터와 근거로 뒷받침되는 문장",
  "논리 비약, 추가 데이터가 필요한 부분",
  "과학적 오개념이나 근거 없는 주장",
  "그렇게 판단한 근거와 출처를 적으세요",
  "쉼표로 구분해 적어보세요",
  "핵심 주제",
  "관련 생각들",
  "세부 예시",
  "용해, 산화…",
  "NEED TO KNOW",
  "EXCITED",
  "WORRIES",
  "STEPS",
];

/** 템플릿·필드별 예시 문구 (필드 키 → 문구 목록) */
const FIELD_EXAMPLE_TEXTS: Record<string, Record<string, string[]>> = {
  "see-think-wonder": {
    see: ["관찰한 내용을 적어보세요", ...SEE_THINK_WONDER_GUIDES.slice(0, 7)],
    think: ["생각과 느낌을 적어보세요", ...SEE_THINK_WONDER_GUIDES.slice(7, 12)],
    wonder: ["궁금한 점을 적어보세요", ...SEE_THINK_WONDER_GUIDES.slice(12)],
  },
  "think-puzzle-explore": {
    think: THINK_PUZZLE_EXPLORE_EXAMPLES.slice(0, 1),
    puzzle: THINK_PUZZLE_EXPLORE_EXAMPLES.slice(1, 2),
    explore: THINK_PUZZLE_EXPLORE_EXAMPLES.slice(2),
  },
  "frayer-model": {
    nonExamples: FRAYER_NONEXAMPLE_CHIPS,
  },
  headline: {
    headline: ["예: '손 소독제, 작은 용액이 지키는 우리의 건강'"],
    headlineReason: [
      "예: 손 소독제는 알코올(용질)이 물(용매)에 녹아 만든 용액이기 때문에 어디서나 같은 성분과 농도로 살균할 수 있다. …",
    ],
  },
  "hot-spots": {
    case1: ["나는 여기가 눈에 띄었어요. 왜냐하면…"],
    case2: ["나는 여기가 눈에 띄었어요. 왜냐하면…"],
  },
  exaggeration: {
    content: ["과장된 질문과 아이디어를 적어보세요"],
  },
  scamper: {
    substitute: ["아이디어에서 바꿀 수 있는 부분은 무엇일까?"],
    combine: ["두 가지 생각을 하나로 합쳐서 새로운 것으로 만들 수 있을까?"],
    adapt: ["이 방법을 다른 곳이나 다른 상황에 그래도 쓸 수 있을까?"],
    modify: ["모양을 더 크게 하거나, 색깔을 바꾸거나, 다르게 고친다면?"],
    putToOtherUse: ["원래 쓰던 곳 말고 완전히 다른 곳에 쓸 수 없을까?"],
    eliminate: ["필요 없는 부분을 빼거나 없애면 어떻게 될까?"],
    reverse: ["순서를 앞뒤로 바꾸거나 거꾸로 뒤집으면 어떻게 될까?"],
  },
  "plus-one": {
    workspace: ["생각을 자유롭게 기록하세요"],
  },
  "claim-support-question": {
    claim: [
      "예시) 색깔이 없는 투명한 용액이더라도 물체를 띄워보면 진하기를 비교할 수 있다.",
    ],
    support: [
      "예시) 왜냐하면 백설탕을 많이 녹여 더 진하게 만든 용액에 방울토마토를 넣었을 때가, 설탕을 적게 녹인 연한 용액에서보다 방울토마토가 훨씬 더 높이 떠 올랐기 때문이다.",
    ],
    question: [
      "예시) 그렇다면 방울토마토가 아니라 메추리알을 넣어도 용액이 진할수록 더 높이 떠오를까?",
    ],
  },
};

function normalizeComparable(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function collectExamples(templateId: string, fieldKey: string): string[] {
  const fieldSpecific = FIELD_EXAMPLE_TEXTS[templateId]?.[fieldKey] ?? [];
  return [...new Set([...fieldSpecific, ...COMMON_PLACEHOLDERS])];
}

/** 값이 예시·가이드 문구를 그대로 사용했는지 검사. 해당 시 예시 문구 반환 */
export function matchUneditedExampleText(
  templateId: string,
  fieldKey: string,
  value: string,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const examples = collectExamples(templateId, fieldKey);
  const normalizedValue = normalizeComparable(trimmed);

  for (const example of examples) {
    if (normalizeComparable(example) === normalizedValue) {
      return example;
    }
  }

  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1) {
    for (const example of examples) {
      if (normalizeComparable(lines[0]) === normalizeComparable(example)) {
        return example;
      }
    }
  }

  return null;
}
