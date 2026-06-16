import type { TemplateDefinition, ToolCategory } from "@/lib/types";
import { LEGACY_TEMPLATE_REGISTRY } from "./legacy-registry";

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  // 1. 질문하기
  {
    id: "see-think-wonder",
    order: 1,
    name: "See, Think, Wonder",
    nameEn: "보기·생각하기·궁금해하기",
    category: "questioning",
    description: "관찰·생각·궁금증 기록",
    aiFeatureLabel: "입력 가이드",
    aiFeature:
      "학생이 실험 사진이나 현상 영상을 업로드하면, AI가 세 가지 질문 칸(본 것, 생각한 것, 궁금한 것)을 제시하여 팩트와 추론을 분리하도록 가이드합니다.",
    headerFields: ["unit", "period", "inquiryQuestion", "writingContext"],
  },
  {
    id: "zoom-in",
    order: 2,
    name: "Zoom In",
    nameEn: "줌인(확대하기)",
    category: "questioning",
    description: "점진적 이미지 확대 추리",
    aiFeatureLabel: "마이크로 러닝",
    aiFeature:
      "AI가 데이터 그래프나 현상 이미지의 핵심 단서(예: 특이점, 꺾이는 지점)를 단계적으로 확대해 보여주며 미시적 관찰을 유도합니다.",
    headerFields: ["writingContext"],
  },
  {
    id: "chalk-talk",
    order: 3,
    name: "Chalk Talk",
    nameEn: "분필 토론",
    category: "questioning",
    description: "침묵 속 아이디어 공유",
    aiFeatureLabel: "실시간 협업 보드",
    aiFeature:
      "모둠 학생들이 패들렛 형태의 익명 캔버스에서 텍스트로만 서로의 관찰 의견을 주고받으면, AI가 핵심 키워드를 실시간 클러스터링(시각화)합니다.",
    headerFields: ["writingContext"],
  },
  {
    id: "think-puzzle-explore",
    order: 4,
    name: "Think, Puzzle, Explore",
    nameEn: "생각하기·퍼즐·탐색하기",
    category: "questioning",
    description: "알고 있는 것·궁금한 점·탐구",
    aiFeatureLabel: "선행지식 진단",
    aiFeature:
      "글을 쓰기 전, 아는 것(Think), 의문(Puzzle), 탐구 계획(Explore)을 입력받아 AI가 학생의 수준과 오개념을 진단하는 초기 입력 폼입니다.",
    headerFields: ["writingContext"],
  },
  {
    id: "starbursting",
    order: 5,
    name: "Starbursting",
    nameEn: "스타버스팅",
    category: "questioning",
    description: "5W1H 질문 확장",
    aiFeatureLabel: "육하원칙 질문 생성기",
    aiFeature:
      "현상에 대해 학생이 주도적으로 6가지 방향(무엇을, 왜, 어떻게 등)의 과학적 질문을 던질 수 있도록 챗봇이 템플릿을 제공합니다.",
    headerFields: ["description"],
  },

  // 2. 탐구하기
  {
    id: "what-makes-you-say-that",
    order: 1,
    name: "What Makes You Say That?",
    nameEn: "그렇게 말하는 이유는?",
    category: "inquiring",
    description: "주장에 대한 증거 요구",
    aiFeatureLabel: "증거 요구(Prompt)",
    aiFeature:
      "학생이 가설이나 주장을 입력했을 때, AI 챗봇이 자동으로 \"그렇게 판단한 실험 데이터(또는 텍스트) 근거는 무엇인가요?\"라며 출처와 증거 입력을 강제합니다.",
    headerFields: ["writingContext", "inquiryQuestion"],
  },
  {
    id: "e3",
    order: 2,
    name: "Estimate, Explore, Explain",
    nameEn: "E3 추리·탐구·설명",
    category: "inquiring",
    description: "예측·실험·설명 탐구",
    aiFeatureLabel: "예측-실험-매칭 엔진",
    aiFeature:
      "[예측치 입력] → [실험 데이터 입력] → [AI가 예측과 실제 결과의 차이를 시각화] → [과학적 설명 작성]으로 이어지는 탐구 위젯입니다.",
    headerFields: ["unit", "inquiryQuestion", "writingContext"],
  },
  {
    id: "five-why",
    order: 3,
    name: "5WHY's",
    nameEn: "5WHY 활동지",
    category: "inquiring",
    description: "5번의 왜 질문",
    aiFeatureLabel: "심층 원인 분석기",
    aiFeature:
      "현상에 대해 학생이 답을 입력할 때마다 AI가 연속으로 \"왜?\"를 5번 질문하여 표면적 현상 아래 숨겨진 심층 과학 원리에 도달하게 합니다.",
    headerFields: ["writingContext"],
  },
  {
    id: "circle-of-viewpoints",
    order: 4,
    name: "Circle of Viewpoints",
    nameEn: "관점의 원",
    category: "inquiring",
    description: "다양한 관점 탐색",
    aiFeatureLabel: "다각적 시뮬레이터",
    aiFeature:
      "과학 기술의 사회적 영향(STS)이나 생태계 문제를 다룰 때, AI가 다른 주체(예: 환경운동가, 개발자, 동식물)의 페르소나를 장착하고 학생과 논쟁합니다.",
    headerFields: ["writingContext"],
  },
  {
    id: "step-inside",
    order: 5,
    name: "Step Inside",
    nameEn: "안으로 들어가기",
    category: "inquiring",
    description: "대상 속으로 들어가기",
    aiFeatureLabel: "가상 관점 빙의",
    aiFeature:
      "학생이 '물 분자', '이산화탄소 뼈대' 등 과학적 대상 자체가 되었다고 가정하고 글을 쓰도록 AI가 상황과 맥락적 프롬프트를 주입합니다.",
    headerFields: ["description"],
  },
  {
    id: "mandalart",
    order: 6,
    name: "만다라트",
    category: "inquiring",
    description: "실험 설계 변수 정리",
    aiFeatureLabel: "변인 통제 매트릭스",
    aiFeature:
      "과학 실험 설계 시 독립변인, 종속변인, 통제변인 등을 8방향의 디지털 매트릭스에 빠짐없이 채우도록 돕는 UI입니다.",
    headerFields: ["description"],
  },
  {
    id: "brainstorming",
    order: 7,
    name: "브레인스토밍",
    category: "inquiring",
    description: "4가지 원칙 아이디어",
    aiFeatureLabel: "아이디어 무한 캔버스",
    aiFeature:
      "실험 방법이나 해결책을 자유롭게 입력하면 AI가 실시간으로 마인드맵 형태로 확장해 주는 기능입니다.",
    headerFields: ["description"],
  },
  {
    id: "brainwriting-635",
    order: 8,
    name: "Brainwriting",
    nameEn: "브레인라이팅",
    category: "inquiring",
    description: "6-3-5 아이디어 확산",
    aiFeatureLabel: "비동기 데이터 축적",
    aiFeature:
      "모둠원들이 각자 컴퓨터에서 실험 아이디어를 입력하면 AI가 이를 순차적으로 순환 배달하여 텍스트 기반의 집단지성을 유도합니다.",
    headerFields: ["description"],
  },

  // 3. 일반화하기
  {
    id: "frayer-model",
    order: 1,
    name: "프레이어 모델",
    nameEn: "Frayer Model",
    category: "generalizing",
    description: "개념 정의·속성·예·비예시",
    aiFeatureLabel: "과학 개념 정의기",
    aiFeature:
      "글에 사용될 핵심 과학 용어의 [정의/특징/예시/비예시] 스페이스를 AI가 제공하여 용어의 오개념을 원천 차단합니다. 비예시 칸에서 AI 추천 칩을 제공합니다.",
    headerFields: ["unit", "period", "inquiryQuestion", "writingContext"],
  },
  {
    id: "claim-support-question",
    order: 2,
    name: "Claim, Support, Question",
    nameEn: "주장·근거·질문",
    category: "generalizing",
    description: "CER 구조화 글쓰기",
    aiFeatureLabel: "CER 구조화 대시보드",
    aiFeature:
      "과학 글쓰기의 기본 뼈대. [핵심 주장(C)] - [이를 지원하는 데이터(S)]를 매칭하고, [해결되지 않은 추가 질문(Q)]을 방으로 나누어 입력하는 구조입니다.",
    headerFields: ["writingContext"],
  },
  {
    id: "gsce",
    order: 3,
    name: "Generate-Sort-Connect-Elaborate",
    nameEn: "생성·분류·연결·정교화",
    category: "generalizing",
    description: "아이디어 생성과 구체화",
    aiFeatureLabel: "개요 작성 마법사",
    aiFeature:
      "아이디어 나열(G) → 카테고리 분류(S) → 화살표 연결(C) → 세부 서술(E)의 단계별 UI를 통해 AI가 개요를 하나의 완성된 텍스트 흐름으로 변환합니다.",
    headerFields: ["writingContext"],
  },
  {
    id: "fishbone",
    order: 4,
    name: "Fishbone",
    nameEn: "피쉬본",
    category: "generalizing",
    description: "원인·결과 인과관계",
    aiFeatureLabel: "인과관계 다이어그램 생성기",
    aiFeature:
      "현상의 원인(원인 법칙)과 결과(현상)를 물고기 뼈대 UI에 입력하면, AI가 이를 논리적 인과 문장으로 변환해 줍니다.",
    headerFields: ["writingContext"],
  },
  {
    id: "headline",
    order: 5,
    name: "Headline",
    nameEn: "표제 만들기",
    category: "generalizing",
    description: "핵심을 한 문장으로",
    aiFeatureLabel: "논문 제목 추천기",
    aiFeature:
      "완성될 글의 핵심 요약을 바탕으로, AI가 가장 과학적이고 직관적인 '연구 보고서 제목' 후보 3가지를 추천해 주는 기능입니다.",
    headerFields: ["writingContext"],
  },
  {
    id: "color-symbol-image",
    order: 6,
    name: "Color, Symbol, Image",
    nameEn: "색상·기호·이미지",
    category: "generalizing",
    description: "시각적 요약 정리",
    aiFeatureLabel: "시각적 요약(인포그래픽)",
    aiFeature:
      "학생이 텍스트로 정리한 일반화 명제를 기반으로, AI가 어울리는 색상과 기호, 이미지를 매칭하여 과학 포스터 요약본을 자동 생성합니다.",
    headerFields: ["description"],
  },
  {
    id: "four-cs",
    order: 7,
    name: "The 4 C's",
    nameEn: "연결·도전·개념·변화",
    category: "generalizing",
    description: "Connections·Challenge·Concepts·Changes",
    aiFeatureLabel: "개념 매핑 보고서",
    aiFeature:
      "기존 지식과의 연결, 해결 과제, 핵심 개념, 인식의 변화를 4개 영역으로 구조화하여 대단원 마무리 글쓰기 템플릿으로 활용합니다.",
    headerFields: ["description"],
  },
  {
    id: "inquiry-classroom-rules",
    order: 8,
    name: "정확한 탐구교실 규칙",
    category: "generalizing",
    description: "과학 글쓰기 프로토콜",
    aiFeatureLabel: "글쓰기 프로토콜 세팅",
    aiFeature:
      "\"객관적 수치 사용하기\", \"추측성 어조 지양하기\" 등 과학 글쓰기 AI 규칙을 상시 화면 우측에 플로팅 위젯으로 띄워줍니다.",
    headerFields: ["description"],
  },

  // 4. 전이하기
  {
    id: "stop-light",
    order: 1,
    name: "Red Light, Yellow Light, Green Light",
    nameEn: "빨간불·노란불·초록불",
    category: "transfer",
    description: "초고 퇴고·논리 검증",
    aiFeatureLabel: "AI 논리 필터 / 퇴고 엔진",
    aiFeature:
      "★핵심: AI가 학생의 초고를 분석하여, 검증된 팩트(초록불), 논리 비약이나 데이터 보완 필요(노란불), 과학적 오개념이나 가짜뉴스(빨간불)로 하이라이팅해 줍니다.",
    headerFields: ["description"],
  },
  {
    id: "scamper",
    order: 2,
    name: "SCAMPER",
    nameEn: "스캠퍼",
    category: "transfer",
    description: "가설 확장·변형",
    aiFeatureLabel: "가설 확장/변형 변환기",
    aiFeature:
      "\"만약 온도를 대체(Substitute)한다면?\", \"실험 규모를 확대(Magnify)한다면?\" 등 AI가 글의 결론을 다른 조건에 전이시킬 수 있도록 변형 아이디어를 제안합니다.",
    headerFields: ["description"],
  },
  {
    id: "six-thinking-hats",
    order: 3,
    name: "육색사고모 기법",
    nameEn: "6 Thinking Hats",
    category: "transfer",
    description: "6가지 관점 퇴고",
    aiFeatureLabel: "6가지 모드 AI 에디터",
    aiFeature:
      "직관 모드(적색), 데이터 집중 모드(백색), 비판적 오류 찾기 모드(흑색) 등으로 AI 가이드를 변경하며 내 글을 다각도로 퇴고합니다.",
    headerFields: ["writingContext", "description"],
  },
  {
    id: "ladder-of-feedback",
    order: 4,
    name: "Ladder of Feedback",
    nameEn: "피드백의 사다리",
    category: "transfer",
    description: "5단계 피드백",
    aiFeatureLabel: "동료 피드백 프로토콜",
    aiFeature:
      "학생 간 글을 공유할 때 AI가 [이해-가치인정-의문-제안]의 단계별 댓글 템플릿을 제공하여 건설적인 과학적 비평이 오가게 합니다.",
    headerFields: ["description"],
  },
  {
    id: "give-3-feedback",
    order: 5,
    name: "Give 3 - Feedback Routine",
    nameEn: "3가지 피드백 루틴",
    category: "transfer",
    description: "3가지 영역 피드백",
    aiFeatureLabel: "3가지 관점 AI 피드백",
    aiFeature:
      "AI가 글의 '과학적 정확성', '데이터 활용도', '문장 논리성' 3가지 영역에 대해 명확한 피드백 점수와 조언을 배달합니다.",
    headerFields: ["description"],
  },
  {
    id: "question-bank",
    order: 6,
    name: "말하기·묻기·아이디어·제안",
    category: "transfer",
    description: "피드백 대화 가이드",
    aiFeatureLabel: "피드백 챗봇 가이드",
    aiFeature:
      "친구의 탐구 글에 코멘트를 달 때 가이드라인을 잡아주는 피드백 어시스턴트 기능입니다.",
    headerFields: ["description"],
  },

  // 5. 자기 성찰 및 교류
  {
    id: "i-used-to-think",
    order: 1,
    name: "I Used to Think... Now I Think...",
    nameEn: "예전에는… 지금 생각은?",
    category: "reflection-exchange",
    description: "생각의 변화 성찰",
    aiFeatureLabel: "개념 변화 타임라인",
    aiFeature:
      "★핵심: [1단계 질문하기]에서 썼던 생각과 [4단계 전이하기] 이후의 생각을 AI가 대조하여 보여주며, 학생이 자신의 메타인지적 개념 성장을 한 편의 성찰 글로 쓰도록 유도합니다.",
    headerFields: ["description"],
  },
  {
    id: "three-two-one-reflection",
    order: 2,
    name: "3-2-1 Bridge",
    nameEn: "3-2-1 연결",
    category: "reflection-exchange",
    description: "단어 3·질문 2·비유 1 연결",
    aiFeatureLabel: "단어-질문-비유 매칭 리포트",
    aiFeature:
      "탐구 전후의 단어 3개, 질문 2개, 비유 1개의 변화를 연결선(Bridge) 그래프로 시각화하여 대시보드에 표출합니다.",
    headerFields: ["unit", "inquiryQuestion"],
  },
  {
    id: "traffic-light-reflection",
    order: 3,
    name: "Traffic Light Reflection",
    nameEn: "신호등 성찰",
    category: "reflection-exchange",
    description: "이해 수준 자기 점검",
    aiFeatureLabel: "역량 성찰 리포트",
    aiFeature:
      "이해 완료(초록), 모호함(노랑), 재학습 필요(빨강) 영역을 스스로 체크하면 AI가 맞춤형 보충 과학 텍스트를 추천합니다.",
    headerFields: ["description"],
  },
  {
    id: "show-of-thumbs-reflection",
    order: 4,
    name: "Show of Thumbs Reflection",
    nameEn: "엄지 표시 성찰",
    category: "reflection-exchange",
    description: "난이도·몰입도 성찰",
    aiFeatureLabel: "직관적 대시보드 성찰",
    aiFeature:
      "이번 탐구 글쓰기의 난이도와 몰입도를 엄지손가락 아이콘 방향으로 빠르게 슬라이딩하여 등록하는 간이 평가 UI입니다.",
    headerFields: ["description"],
  },
  {
    id: "four-cs-reflection",
    order: 5,
    name: "4C 반성",
    nameEn: "The 4 C's Reflection",
    category: "reflection-exchange",
    description: "글쓰기 전반 성찰",
    aiFeatureLabel: "종합 성찰 루틴",
    aiFeature:
      "글쓰기 전반의 개념적 성장을 종합 리포트 형태로 자동 아카이빙하는 기능입니다.",
    headerFields: ["description"],
  },
  {
    id: "give-one-get-one",
    order: 6,
    name: "Give One, Get One",
    nameEn: "하나 주고, 하나 받기",
    category: "reflection-exchange",
    description: "지식 교환",
    aiFeatureLabel: "지식 마켓플레이스",
    aiFeature:
      "내가 발견한 과학적 사실/표현(Give)을 시스템에 등록해야만, 다른 친구가 발견한 꿀팁(Get) 하나를 열람할 수 있는 AI 공유 매커니즘입니다.",
    headerFields: ["description"],
  },
  {
    id: "plus-one",
    order: 7,
    name: "+1 Routine",
    nameEn: "플러스 원",
    category: "reflection-exchange",
    description: "Plus One 협력 루틴",
    aiFeatureLabel: "지식 이어달리기",
    aiFeature:
      "다른 사람이 쓴 탐구 글 위에 마우스를 올리고 과학적 아이디어나 반박 데이터를 '+1' 레이어로 얹어 글을 공동 진화시키는 기능입니다.",
    headerFields: ["description"],
  },
  {
    id: "think-talk-open-exchange",
    order: 8,
    name: "Think Talk Open Exchange",
    nameEn: "생각하기·말하기·열린 교류",
    category: "reflection-exchange",
    description: "열린 토론 교류",
    aiFeatureLabel: "AI 주도 토론방",
    aiFeature:
      "공동 주제에 대해 AI가 사회자가 되어 학생들의 생각을 실시간으로 매칭하고, 상반된 데이터 코멘트를 던져 오픈 토론을 활성화합니다.",
    headerFields: ["description"],
  },
  {
    id: "leaderless-discussion",
    order: 9,
    name: "The Leaderless Discussion",
    nameEn: "리더 없는 토론",
    category: "reflection-exchange",
    description: "데이터 기반 자율 토론",
    aiFeatureLabel: "데이터 기반 자율 토론",
    aiFeature:
      "리더 없이 데이터를 기반으로 의견을 교환할 때, AI가 대화의 논점 이탈을 막아주는 중립적 중재자(Moderator) 역할을 수행합니다.",
    headerFields: ["description"],
  },
  {
    id: "making-meaning",
    order: 10,
    name: "Making Meaning",
    nameEn: "의미 만들기",
    category: "reflection-exchange",
    description: "집단적 과학 의미 도출",
    aiFeatureLabel: "종합 지식 단어구름",
    aiFeature:
      "학급 전체가 작성한 과학 탐구 글을 AI가 형태소 분석하여, 우리 반이 이번 탐구로 도출해 낸 '집단적 과학 의미(Word Cloud)'를 시각화합니다.",
    headerFields: ["description"],
  },
];

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return (
    TEMPLATE_REGISTRY.find((t) => t.id === id) ??
    LEGACY_TEMPLATE_REGISTRY.find((t) => t.id === id)
  );
}

export function getSortedTemplates(): TemplateDefinition[] {
  return [...TEMPLATE_REGISTRY].sort((a, b) => {
    const catOrder = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (catOrder !== 0) return catOrder;
    return a.order - b.order;
  });
}

export const CATEGORY_ORDER: ToolCategory[] = [
  "questioning",
  "inquiring",
  "generalizing",
  "transfer",
  "reflection-exchange",
];

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  questioning: "1. 질문하기",
  inquiring: "2. 탐구하기",
  generalizing: "3. 일반화하기",
  transfer: "4. 전이하기",
  "reflection-exchange": "5. 자기 성찰 및 교류",
};

export const CATEGORY_SUBTITLES: Partial<Record<ToolCategory, string>> = {
  questioning: "사고도구 기법 · AI 프로그램 구현 방식(입력 가이드·마이크로 러닝 등)",
  inquiring: "탐구 과정에서 증거·관점·실험 설계를 심화합니다",
  generalizing: "개념 정의·CER·인과관계로 일반화합니다",
  transfer: "퇴고·피드백·가설 전이로 확장합니다",
  "reflection-exchange": "성찰과 학급 지식 교류로 마무리합니다",
};

export function getCategoryGroups() {
  return CATEGORY_ORDER.map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
    subtitle: CATEGORY_SUBTITLES[id],
    templates: TEMPLATE_REGISTRY.filter((t) => t.category === id).sort((a, b) => a.order - b.order),
  })).filter((g) => g.templates.length > 0);
}
