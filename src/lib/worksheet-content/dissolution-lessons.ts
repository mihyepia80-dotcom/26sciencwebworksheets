/**
 * 용해와 용액 단원 — 1~8차시 사고도구 웹학습지 맞춤형 프롬프트·구조 (단일 소스)
 */

export interface DissolutionLessonDefinition {
  /** 1~8 */
  lessonNumber: number;
  /** URL·프리셋 키 (예: 1/8) */
  period: string;
  /** 표시용 (예: 1차시) */
  periodLabel: string;
  learningTopic: string;
  /** 핵심 사고 도구 명칭 */
  thinkingTool: string;
  /** 연동 React 템플릿 id (주 사고도구) */
  templateId: string;
  /** 구조 이해 — 교사·학습지 안내용 */
  structureUnderstanding: string;
  /** 핵심 질문 */
  keyQuestion: string;
  /** 사고도구 웹학습지 템플릿 프롬프트 */
  templatePrompt: string;
  /** Standalone HTML 경로 (public/) */
  htmlPath: string;
  /** worksheet-content 편집 필드 */
  fields: Record<string, string>;
}

const UNIT = "3. 용해와 용액";

export const DISSOLUTION_LESSONS: DissolutionLessonDefinition[] = [
  {
    lessonNumber: 1,
    period: "1/8",
    periodLabel: "1차시",
    learningTopic: "물질이 물에 녹으면 어떻게 되는지 관찰하기",
    thinkingTool: "STW (See–Think–Wonder), 3-2-1 Bridge",
    templateId: "see-think-wonder",
    structureUnderstanding:
      "STW와 3-2-1 Bridge는 관찰한 사실을 바탕으로 생각과 궁금증을 구조화하도록 돕는 사고 도구이다. " +
      "학생들은 물질이 물에 녹는 모습을 보며 보이는 변화와 보이지 않는 변화를 구분하고, 자신이 본 것과 생각한 것, 궁금한 점을 차례로 정리한다. " +
      "이를 통해 용해 현상을 단순히 보는 데서 그치지 않고, 관찰을 토대로 과학적 질문을 생성하는 경험을 할 수 있다.",
    keyQuestion:
      "물질이 물에 녹을 때 눈에 보이는 변화와 보이지 않는 변화는 무엇이며, 우리는 무엇을 관찰해야 할까?",
    templatePrompt:
      "See: 내가 본 것은 무엇인가? / Think: 그것을 보고 무엇을 생각했는가? / Wonder: 무엇이 더 궁금한가?",
    htmlPath: "/lesson-01-stw.html",
    fields: {
      unit: UNIT,
      topic: "물질이 물에 녹으면 어떻게 되는지 관찰하기",
      inquiryQuestion:
        "물질이 물에 녹을 때 눈에 보이는 변화와 보이지 않는 변화는 무엇이며, 우리는 무엇을 관찰해야 할까?",
      structureUnderstanding:
        "STW와 3-2-1 Bridge는 관찰한 사실을 바탕으로 생각과 궁금증을 구조화하도록 돕는 사고 도구이다.",
      templatePrompt:
        "See: 내가 본 것은 무엇인가? / Think: 그것을 보고 무엇을 생각했는가? / Wonder: 무엇이 더 궁금한가?",
      writingGuide:
        "여러 가지 물질이 물에 녹는 모습을 자세히 살펴보세요. 보이는 변화와 보이지 않는 변화를 구분하며 See·Think·Wonder 순서로 정리하고, 수업 후 3-2-1 Bridge로 생각의 연결을 이어 가 보세요.",
      reminder1: "See: 색·모양·변화 등 관찰 사실만 객관적으로 적으세요.",
      reminder2: "Think와 Wonder: 관찰을 바탕으로 생각과 탐구 질문을 만드세요.",
      usageTips: "실험 과정·결과는 「실험 과정·결과 기록」란에 함께 적으세요.",
      hint_see: "내가 본 것은 무엇인가?",
      hint_think: "그것을 보고 무엇을 생각했는가?",
      hint_wonder: "무엇이 더 궁금한가?",
    },
  },
  {
    lessonNumber: 2,
    period: "2/8",
    periodLabel: "2차시",
    learningTopic: "물질이 물에 녹거나 가라앉는 성질과 용해 전후 무게 변화 이해하기",
    thinkingTool: "I Used to Think... Now I Think...",
    templateId: "i-used-to-think",
    structureUnderstanding:
      "I Used to Think... Now I Think...는 이전에 생각했던 내용과 새롭게 알게 된 내용을 비교하며 사고의 변화를 정리하는 사고 도구이다. " +
      "학생들은 물질이 물에 녹거나 가라앉는 현상과 용해 전후의 무게 변화를 관찰한 뒤, 자신이 기존에 생각하던 내용과 새롭게 생각하게 된 내용을 나란히 정리한다. " +
      "이를 통해 용해 현상에 대한 오개념을 수정하고, 무게 변화에 대한 과학적 이해를 확장할 수 있다.",
    keyQuestion: "물질이 물에 녹을 때 무게는 왜 달라지지 않는 것처럼 보일까?",
    templatePrompt:
      "예전에는: 나는 물질이 녹으면 무게가 줄어든다고 생각했다. / 지금은: 나는 용해 전후 무게가 같게 나타난다고 생각한다. / 왜냐하면: ___이기 때문이다.",
    htmlPath: "/lesson-02-i-used-to-think.html",
    fields: {
      unit: UNIT,
      topic: "물질이 물에 녹거나 가라앉는 성질과 용해 전후 무게 변화 이해하기",
      inquiryQuestion: "물질이 물에 녹을 때 무게는 왜 달라지지 않는 것처럼 보일까?",
      structureUnderstanding:
        "예전 생각과 지금 생각을 비교하며 용해·무게 변화에 대한 오개념을 수정합니다.",
      templatePrompt:
        "예전에는: ___ / 지금은: ___ / 왜냐하면: ___이기 때문이다.",
      writingGuide:
        "탐구 전 「예전 생각」과 탐구 후 「지금 생각」을 나란히 적고, 실험·관찰 근거로 왜 생각이 바뀌었는지 설명해 보세요.",
      reminder1: "용해 전후 무게 측정 결과를 실험 기록란에 적어 두세요.",
      usageTips: "무게가 같게 나타나는 이유를 물질 보존과 연결해 보세요.",
      hint_usedToThink: "예전에는: 나는 물질이 녹으면 무게가 줄어든다고 생각했다.",
      hint_nowThink: "지금은: 나는 용해 전후 무게가 같게 나타난다고 생각한다. 왜냐하면 ___이기 때문이다.",
    },
  },
  {
    lessonNumber: 3,
    period: "3/8",
    periodLabel: "3차시",
    learningTopic: "용해 전후 무게 변화와 물질 보존성 설명하기",
    thinkingTool: "E3 (예측-탐구-설명)",
    templateId: "e3",
    structureUnderstanding:
      "E3는 현상을 예측하고, 탐구를 통해 확인한 뒤, 그 결과를 과학적으로 설명하는 사고 도구이다. " +
      "학생들은 용해 전후 무게 변화를 예측하고 직접 탐구한 결과를 바탕으로 물질 보존의 원리를 설명한다. " +
      "이를 통해 용해 현상을 단순한 관찰에서 과학적 원리의 설명으로 확장할 수 있다.",
    keyQuestion: "용해 전후 무게가 같게 나타나는 현상은 물질 보존과 어떤 관련이 있을까?",
    templatePrompt:
      "예측: 나는 용해 전후 무게가 ___할 것이라고 예측한다. / 탐구: 실제로 측정해 보니 ___였다. / 설명: 이것은 ___ 때문이라고 설명할 수 있다.",
    htmlPath: "/lesson-03-e3.html",
    fields: {
      unit: UNIT,
      topic: "용해 전후 무게 변화와 물질 보존성 설명하기",
      inquiryQuestion: "용해 전후 무게가 같게 나타나는 현상은 물질 보존과 어떤 관련이 있을까?",
      templatePrompt:
        "예측 → 탐구(측정) → 설명 순서로 물질 보존 원리를 연결하세요.",
      writingGuide:
        "용해 전후 무게 변화를 예측하고, 측정 데이터를 기록한 뒤, 물질 보존 원리로 과학적으로 설명해 보세요.",
      reminder1: "예측과 실제 결과의 차이를 반드시 비교하세요.",
      usageTips: "측정값(그램)을 탐구란에 구체적으로 적으세요.",
      hint_estimate: "예측: 나는 용해 전후 무게가 ___할 것이라고 예측한다.",
      hint_exploreData: "탐구: 실제로 측정해 보니 ___였다.",
      hint_explain: "설명: 이것은 ___ 때문이라고 설명할 수 있다.",
    },
  },
  {
    lessonNumber: 4,
    period: "4/8",
    periodLabel: "4차시",
    learningTopic: "물에 녹는 용질의 양에 영향을 미치는 요인 탐구하기",
    thinkingTool: "4C (Connections-Challenges-Concepts-Changes)",
    templateId: "four-cs",
    structureUnderstanding:
      "4C는 배운 내용을 연결하고, 탐구 과정에서의 도전과 핵심 개념, 변화된 생각을 정리하는 사고 도구이다. " +
      "학생들은 용질의 종류와 물의 온도에 따른 용해량 차이를 탐구하며, 변인 통제의 중요성을 이해하고 자신의 생각 변화를 정리한다. " +
      "이를 통해 용해량을 결정하는 과학적 요인을 구조적으로 설명할 수 있다.",
    keyQuestion: "어떤 조건이 용질의 용해량을 달라지게 하며, 그 이유는 무엇일까?",
    templatePrompt:
      "Connection: 나는 ___와(과) 연결해서 생각했다. / Challenge: 탐구하면서 가장 어려웠던 점은 ___였다. / Concept: 핵심 개념은 ___이다. / Change: 내 생각은 ___로 바뀌었다.",
    htmlPath: "/lesson-04-4c.html",
    fields: {
      unit: UNIT,
      topic: "물에 녹는 용질의 양에 영향을 미치는 요인 탐구하기",
      inquiryQuestion: "어떤 조건이 용질의 용해량을 달라지게 하며, 그 이유는 무엇일까?",
      templatePrompt:
        "Connection · Challenge · Concept · Change 네 관점에서 탐구를 정리하세요.",
      writingGuide:
        "용질 종류·물 온도 탐구 후 4C로 연결·도전·핵심 개념·변화된 생각을 구조적으로 적어 보세요.",
      reminder1: "공정한 실험을 위해 통제한 변인과 바꾼 변인을 구분하세요.",
      reminder2: "용질, 용매, 용해량, 변인 통제 등 핵심 개념을 Concept에 포함하세요.",
      hint_connections: "Connection: 나는 ___와(과) 연결해서 생각했다.",
      hint_challenge: "Challenge: 탐구하면서 가장 어려웠던 점은 ___였다.",
      hint_concepts: "Concept: 핵심 개념은 ___이다.",
      hint_changes: "Change: 내 생각은 ___로 바뀌었다.",
    },
  },
  {
    lessonNumber: 5,
    period: "5/8",
    periodLabel: "5차시",
    learningTopic: "용액의 진하기 비교 방법 탐구하기",
    thinkingTool: "Claim, Support, Question (CSQ)",
    templateId: "claim-support-question",
    structureUnderstanding:
      "Claim, Support, Question은 주장·근거·질문으로 과학적 설명을 구조화하는 사고 도구이다. " +
      "학생들은 용액의 진하기를 비교하는 탐구 결과를 바탕으로 주장을 세우고, 실험 데이터로 근거를 제시하며, 새로운 탐구 질문을 생성한다. " +
      "이를 통해 데이터 기반의 과학적 글쓰기 경험을 할 수 있다.",
    keyQuestion: "우리는 어떤 기준으로 용액의 진하기를 비교할 수 있을까?",
    templatePrompt:
      "주장: 나는 ○○용액이 더 진하다고 생각한다. / 근거: 왜냐하면 ○○에서 더 많이 진하게 나타났기 때문이다. / 질문: 그렇다면 용액의 진하기는 어떤 조건에서 더 달라질까?",
    htmlPath: "/lesson-05-csq.html",
    fields: {
      unit: UNIT,
      topic: "용액의 진하기 비교 방법 탐구하기",
      inquiryQuestion: "우리는 어떤 기준으로 용액의 진하기를 비교할 수 있을까?",
      templatePrompt: "주장 → 근거(실험 데이터) → 후속 질문 순으로 작성하세요.",
      writingGuide:
        "탐구 결과를 Claim·Support·Question으로 나누어, 왜 그렇게 생각하는지 근거를 들어 설명하고 더 알고 싶은 질문을 적어 보세요.",
      reminder1: "색깔 있는 용액과 없는 용액의 진하기 비교 방법을 구분하세요.",
      usageTips: "방울토마토·색깔 변화 등 관찰 데이터를 근거란에 구체적으로 연결하세요.",
      hint_claim: "주장: 나는 ○○용액이 더 진하다고 생각한다.",
      hint_support: "근거: 왜냐하면 ○○에서 더 많이 진하게 나타났기 때문이다.",
      hint_question: "질문: 그렇다면 용액의 진하기는 어떤 조건에서 더 달라질까?",
    },
  },
  {
    lessonNumber: 6,
    period: "6/8",
    periodLabel: "6차시",
    learningTopic: "일상생활에서 용액을 이용하는 사례 조사하기",
    thinkingTool: "Headlines",
    templateId: "headline",
    structureUnderstanding:
      "Headlines는 여러 정보를 하나의 핵심 문장으로 압축하여, 배운 내용의 의미를 짧고 선명하게 정리하도록 돕는 사고 도구이다. " +
      "학생들은 일상생활 속 용액 사례를 조사한 뒤, 용액이 우리 삶에 왜 필요한지를 한 줄 헤드라인으로 정리한다. " +
      "이를 통해 생활 속 과학의 가치를 압축적으로 표현하는 경험을 할 수 있다.",
    keyQuestion: "우리 생활 속에서 용액은 어떤 방식으로 활용되며, 왜 필요한가?",
    templatePrompt:
      "헤드라인: 내가 조사한 용액의 가장 중요한 가치는 무엇인가? / 이유: 왜 그렇게 생각하는가?",
    htmlPath: "/lesson-06-headlines.html",
    fields: {
      unit: UNIT,
      topic: "일상생활에서 용액을 이용하는 사례 조사하기",
      inquiryQuestion: "우리 생활 속에서 용액은 어떤 방식으로 활용되며, 왜 필요한가?",
      templatePrompt: "헤드라인(한 줄) + 그 이유를 과학 용어와 연결하여 설명하세요.",
      writingGuide:
        "조사한 용액 사례의 가치를 신문 기사 제목처럼 짧고 선명한 헤드라인으로 정리하고, 왜 그렇게 생각하는지 설명해 보세요.",
      reminder1: "용질·용매·용액·균일성 등 과학 용어를 이유 설명에 포함하세요.",
      usageTips: "구강 청결제, 식초, 손 소독제 등 구체적 사례를 조사하세요.",
      hint_headline: "헤드라인: 내가 조사한 용액의 가장 중요한 가치는 무엇인가?",
      hint_headlineReason: "이유: 왜 그렇게 생각하는가?",
    },
  },
  {
    lessonNumber: 7,
    period: "7/8",
    periodLabel: "7차시",
    learningTopic: "용액의 필요성을 알리는 디지털 자료 만들기",
    thinkingTool: "CSI (Color, Symbol, Image)",
    templateId: "color-symbol-image",
    structureUnderstanding:
      "CSI는 학습한 내용을 색상, 기호, 이미지로 바꾸어 표현하게 하는 사고 도구이다. " +
      "학생들은 용액의 가치를 단어로만 쓰는 대신, 색과 상징, 이미지를 선택해 자신의 생각을 시각적으로 구조화한다. " +
      "이를 통해 개념을 단순히 아는 수준을 넘어, 의미를 연결하고 재구성하는 경험을 할 수 있다.",
    keyQuestion: "용액의 가치를 다른 사람에게 효과적으로 알리기 위해 어떤 색, 기호, 이미지를 사용할 수 있을까?",
    templatePrompt:
      "Color: 내가 선택한 색은 무엇인가? / Symbol: 내가 선택한 기호는 무엇인가? / Image: 내가 선택한 이미지는 무엇인가? / 이유: 왜 이 표현을 선택했는가?",
    htmlPath: "/lesson-07-csi.html",
    fields: {
      unit: UNIT,
      topic: "용액의 필요성을 알리는 디지털 자료 만들기",
      inquiryQuestion:
        "용액의 가치를 다른 사람에게 효과적으로 알리기 위해 어떤 색, 기호, 이미지를 사용할 수 있을까?",
      templatePrompt: "Color · Symbol · Image를 선택하고 각각 과학적 이유를 서술하세요.",
      writingGuide:
        "용액의 필요성과 가치를 색·기호·이미지로 표현하고, 디지털 자료에 담을 메시지를 과학 용어로 설명해 보세요.",
      reminder1: "용액의 균일성·안전성·효과 등 과학적 특징을 비유에 녹이세요.",
      usageTips: "디지털 자료 제작 전 CSI 성찰 글을 먼저 완성하세요.",
      hint_colorReason: "Color: 내가 선택한 색은 무엇인가? 왜 이 색인가?",
      hint_symbolReason: "Symbol: 내가 선택한 기호는 무엇인가?",
      hint_imageReason: "Image: 내가 선택한 이미지는 무엇인가? / 이유: 왜 이 표현을 선택했는가?",
    },
  },
  {
    lessonNumber: 8,
    period: "8/8",
    periodLabel: "8차시",
    learningTopic: "용액을 연구하고 탐구하는 다양한 분야 살펴보기",
    thinkingTool: "4C (Connections-Challenges-Concepts-Changes)",
    templateId: "four-cs",
    structureUnderstanding:
      "4C는 배운 내용을 연결하고, 탐구 과정에서의 도전과 핵심 개념, 변화된 생각을 정리하는 사고 도구이다. " +
      "학생들은 용액이 미래 사회의 어떤 문제 해결과 진로 분야에 연결될 수 있는지 탐색하며, 단원 전체의 배움을 종합한다. " +
      "이를 통해 용액의 과학적 가치와 사회적 의미를 성찰할 수 있다.",
    keyQuestion: "용액은 미래 사회의 어떤 문제 해결과 진로 분야에 연결될 수 있을까?",
    templatePrompt:
      "Connection: 용액은 어떤 분야와 연결되는가? / Challenge: 어떤 문제를 해결하는 데 도움이 되는가? / Concept: 이때 핵심 개념은 무엇인가? / Change: 내 생각은 어떻게 달라졌는가?",
    htmlPath: "/lesson-08-4c.html",
    fields: {
      unit: UNIT,
      topic: "용액을 연구하고 탐구하는 다양한 분야 살펴보기",
      inquiryQuestion: "용액은 미래 사회의 어떤 문제 해결과 진로 분야에 연결될 수 있을까?",
      templatePrompt:
        "Connection · Challenge · Concept · Change로 단원 전체 배움을 종합하세요.",
      writingGuide:
        "용액 연구·탐구 직업과 미래 사회 문제를 연결하고, 이번 단원을 통해 바뀐 나의 생각을 4C로 정리해 보세요.",
      reminder1: "의약·환경·식품·화학 등 진로 분야와 용액 개념을 연결하세요.",
      usageTips: "1~7차시에서 배운 내용을 Connection·Change에 반영하세요.",
      hint_connections: "Connection: 용액은 어떤 분야와 연결되는가?",
      hint_challenge: "Challenge: 어떤 문제를 해결하는 데 도움이 되는가?",
      hint_concepts: "Concept: 이때 핵심 개념은 무엇인가?",
      hint_changes: "Change: 내 생각은 어떻게 달라졌는가?",
    },
  },
];

export function getDissolutionLesson(period: string): DissolutionLessonDefinition | undefined {
  return DISSOLUTION_LESSONS.find((l) => l.period === period.trim());
}

export function getDissolutionLessonByNumber(n: number): DissolutionLessonDefinition | undefined {
  return DISSOLUTION_LESSONS.find((l) => l.lessonNumber === n);
}

export function getDissolutionLessonByTemplate(templateId: string, period?: string): DissolutionLessonDefinition | undefined {
  if (period) {
    const byPeriod = getDissolutionLesson(period);
    if (byPeriod?.templateId === templateId) return byPeriod;
  }
  return DISSOLUTION_LESSONS.find((l) => l.templateId === templateId);
}
