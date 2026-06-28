/** 실험반 활동지(3번)·사고도구 활동지(4번) — 용해와 용액 단원 차시별 프리셋 */

export interface UnitWorksheetPreset {
  period: string;
  templateId: string;
  templateLabel: string;
  fields: Record<string, string>;
}

export const DISSOLUTION_UNIT_PRESETS: UnitWorksheetPreset[] = [
  {
    period: "1/12",
    templateId: "see-think-wonder",
    templateLabel: "See / Think / Wonder",
    fields: {
      unit: "3. 용해와 용액",
      topic: "물질이 물에 녹으면 어떻게 되는지 관찰하기",
      inquiryQuestion: "여러 가지 가루가 물에 녹을 때 무엇이 달라질까요?",
      writingGuide:
        "여러 가지 물건이 물에 녹는 모습을 자세히 살펴보고, '왜 그럴까?' 궁금한 점을 떠올려 보세요. 관찰한 내용과 생각한 것을 글쓰기로 정리하면서 과학 공부를 더 재미있게 할 수 있어요!",
      reminder1: "보기(See): 색·모양·변화 등 관찰 사실을 먼저 적으세요.",
      reminder2: "궁금해하기(Wonder): 관찰을 바탕으로 탐구 질문을 만들어 보세요.",
      usageTips: "실험 과정·결과는 상단 「실험 과정·결과 기록」란에 함께 적으세요.",
    },
  },
  {
    period: "2/12",
    templateId: "i-used-to-think",
    templateLabel: "예전에는… 했지만, 지금 생각은?",
    fields: {
      unit: "3. 용해와 용액",
      topic: "물질이 녹거나 가라앉을 때 양은 변하지 않음을 설명하기",
      inquiryQuestion: "물질을 물에 넣으면 어떻게 되며, 그 변화를 어떻게 표현할 수 있을까?",
      writingGuide:
        "물에 녹거나 가라앉은 물질이 눈에 보이지 않게 되어도, 정말로 사라진 걸까요? 1단계에서 '처음 생각'을 적고, 마지막에 '새로운 생각'을 적어 무엇이 달라졌는지 꼼꼼하게 적어 주세요.",
      reminder1: "물질이 변해도 그 양은 그대로라는 점을 기억하세요.",
      usageTips: "실험 전·후 무게 변화를 실험 기록란에 적어 두면 글쓰기에 도움이 됩니다.",
    },
  },
  {
    period: "3/12",
    templateId: "what-makes-you-say-that",
    templateLabel: "설명 게임 (The Explanation Game)",
    fields: {
      unit: "3. 용해와 용액",
      topic: "용질이 용해되는 과정과 용해 전후의 무게 변화 살펴보기",
      inquiryQuestion:
        "각설탕이 물에 녹아 눈에 보이지 않게 되면 완전히 사라진 것일까, 아니면 그대로 남아있는 것일까?",
      writingGuide:
        "각설탕이 물에 녹으면 어떻게 변할 것 같은지 생각을 이야기해 보세요. 생각을 뒷받침하는 '이유'를 꼭 함께 적어 주세요!",
      usageTips: "관찰·측정 데이터는 실험 기록란과 연결하여 근거로 사용하세요.",
    },
  },
  {
    period: "4~5/12",
    templateId: "gsce",
    templateLabel: "생성·분류·연결·정교화 (GSCE)",
    fields: {
      unit: "3. 용해와 용액",
      topic: "물에 녹는 용질의 양에 영향을 미치는 요인 탐구하기",
      inquiryQuestion:
        "같은 양의 물에 용질을 최대한 많이 녹이려면 같아야 하는 조건과 달라야 하는 조건은 무엇일까?",
      writingGuide:
        "탐구 1: 오늘 배운 '물에 녹는 용질의 양'과 내 경험을 어떻게 연결할 수 있을까요?\n탐구 2: 새롭게 알게 된 점·더 알고 싶은 점을 적고, 앞으로 어떤 탐구를 해보고 싶은지 써 보세요.",
      intro:
        "오늘 수행한 실험 과정과 결과를 떠올리며, 단어를 생성하고 분류·연결한 뒤 과학적 문장으로 정교화해 봅시다.",
      step1Guide: "기본 과학 단어를 확인하고, 실험에서 나온 새 단어를 포스트잇으로 추가하세요.",
      step2Guide:
        "단어를 [원인/실험 조건]과 [결과/관찰 현상]으로 분류한 뒤, 연결 모드에서 두 칩을 클릭해 관계를 적으세요.",
      step4Guide: "메모 A~C에 용질 종류·물 온도·변인 통제 측면을 각각 서술하세요.",
      reminder1: "공정한 실험을 위해 같게 유지한 조건과 달리 한 조건을 구분하세요.",
      reminder2: "용질, 용매, 용해, 용액 등 과학 용어를 정확히 사용하세요.",
      usageTips: "4~5차시 실험반 활동지 — 변인 통제와 용해량 비교 탐구에 맞춘 GSCE 활동입니다.",
    },
  },
  {
    period: "6~7/12",
    templateId: "claim-support-question",
    templateLabel: "주장·근거·질문 (CSQ)",
    fields: {
      unit: "3. 용해와 용액",
      topic: "용액의 진하기 비교 방법 탐구 및 데이터 기반 과학 글쓰기",
      inquiryQuestion:
        "색깔이 없어서 겉모습이 똑같은 두 투명한 용액 중 어느 것이 더 진한지 어떻게 과학적으로 증명할 수 있을까?",
      writingGuide:
        "과학 탐구를 통해 알게 된 것을 '주장', '근거', '질문'으로 나누어 이야기해 보세요. 왜 그렇게 생각하는지 근거를 들어 설명하고, 더 알고 싶은 질문을 적어 보세요.",
      usageTips: "측정·관찰 데이터를 근거란에 구체적으로 연결하세요.",
    },
  },
  {
    period: "8/12",
    templateId: "headline",
    templateLabel: "헤드라인 (Headlines)",
    fields: {
      unit: "3. 용해와 용액",
      topic: "일상생활에서 용액을 이용하는 사례를 조사하여 가치가 드러나는 과학 글쓰기",
      inquiryQuestion: "우리 주변의 신기한 용액을 찾아보자!",
      writingGuide:
        "우리 생활을 더 안전하고 편리하게 만들어주는 용액을 하나 골라 보세요. 그 용액이 우리에게 얼마나 소중한지, 어떤 좋은 점이 있는지 신문 기사 제목처럼 짧고 멋지게 써 봅시다.",
    },
  },
];

export const THINKING_TOOL_WORKSHEET_HINTS = {
  headerNote: "부록 1. 사고 전략 기법 활용 활동지 — 학반·이름·단원·차시·탐구질문·글쓰기 상황·활용팁을 확인하세요.",
  screenLayout:
    "화면구성: 사고도구별 입력 칸과 실험 과정·결과 기록란을 함께 사용합니다.",
} as const;

export function getDissolutionPreset(period: string): UnitWorksheetPreset | undefined {
  return DISSOLUTION_UNIT_PRESETS.find((p) => p.period === period.trim());
}

export function getDissolutionPresetByTemplate(templateId: string): UnitWorksheetPreset | undefined {
  return DISSOLUTION_UNIT_PRESETS.find((p) => p.templateId === templateId);
}
