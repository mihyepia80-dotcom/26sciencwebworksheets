"use client";

import type { TemplateProps } from "@/lib/types";
import { GuideChips, SectionBox, TextAreaField, GridInput } from "@/components/common/Fields";

const v = (values: Record<string, string>, key: string) => values[key] ?? "";

/* ── See/Think/Wonder ── */
const STW_GUIDES = {
  see: ["~이 보인다.", "~가 변하는 것이 보인다.", "~의 모양·특징이 보인다.", "~의 기호를 알 수 있다.", "~의 특정 부분을 발견했다.", "~의 제스처·감정이 보인다.", "대상 간 공통점·차이점이 보인다."],
  think: ["내 생각에는 ~을 의미하는 것 같다.", "내가 추측하기에는 ~인 것 같다.", "내가 이해하기에는 ~인 것 같다.", "내가 해석하기에는 ~을 의미한다.", "가장 인상 깊었던 점은 ~이다."],
  wonder: ["왜 이럴까?", "만약 ~한다면?", "왜 이렇게 했을까?", "~에 대해 궁금하다.", "두 가지의 관계는?", "어떤 의미가 담겨 있을까?", "어떤 영향을 줄까?", "왜 ~이 가능할까?"],
};

export function SeeThinkWonderTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="See / Think / Wonder" color="blue">
      <div className="grid gap-4 lg:grid-cols-3">
        {(["see", "think", "wonder"] as const).map((key) => (
          <div key={key} className="rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="mb-2 text-sm font-bold uppercase text-slate-700">{key}</h3>
            {!readOnly && (
              <div className="mb-2">
                <GuideChips chips={STW_GUIDES[key]} onSelect={(t) => onChange(key, v(values, key) ? `${v(values, key)}\n${t}` : t)} />
              </div>
            )}
            <TextAreaField
              value={v(values, key)}
              onChange={(val) => onChange(key, val)}
              placeholder={key === "see" ? "관찰한 내용을 적어보세요" : key === "think" ? "생각과 느낌을 적어보세요" : "궁금한 점을 적어보세요"}
              rows={6}
              readOnly={readOnly}
            />
          </div>
        ))}
      </div>
    </SectionBox>
  );
}

/* ── Think Puzzle Explore ── */
export function ThinkPuzzleExploreTemplate({ values, onChange, readOnly }: TemplateProps) {
  const cols = [
    { key: "think", title: "Think (생각하기)", hint: "나는 이 주제에 대해 이미 무엇을 알고 있나요?", ex: "예: '나는 ___에 대해 이런 것을 알고 있어요.'" },
    { key: "puzzle", title: "Puzzle (궁금한 점)", hint: "이 주제에서 무엇이 궁금한가요?", ex: "예: '나는 ___이 왜 그런지 궁금해요.'" },
    { key: "explore", title: "Explore (탐구하기)", hint: "더 알아보기 위해 무엇을 할 수 있을까요?", ex: "예: '책을 찾아보거나 선생님께 물어보고 싶어요.'" },
  ];
  return (
    <SectionBox title="Think · Puzzle · Explore" color="green">
      <div className="grid gap-3 md:grid-cols-3">
        {cols.map(({ key, title, hint, ex }) => (
          <div key={key} className="rounded border border-lime-300 bg-white">
            <div className="bg-lime-300 px-3 py-2 text-sm font-bold">{title}</div>
            <div className="space-y-1 px-3 py-2 text-xs text-slate-500">
              <p>{hint}</p>
              <p className="italic">{ex}</p>
            </div>
            <TextAreaField value={v(values, key)} onChange={(val) => onChange(key, val)} rows={5} readOnly={readOnly} className="px-3 pb-3" />
          </div>
        ))}
      </div>
    </SectionBox>
  );
}

/* ── Claim Support Question ── */
export function ClaimSupportQuestionTemplate({ values, onChange, readOnly }: TemplateProps) {
  const cols = [
    { key: "claim", title: "Claim (주장)", ph: "나는 ___이 중요하다고 생각해요." },
    { key: "support", title: "Support (근거)", ph: "왜냐하면 ___에서 그렇게 말했어요." },
    { key: "question", title: "Question (질문)", ph: "만약 ___라면 어떻게 될까요?" },
  ];
  return (
    <SectionBox title="Claim · Support · Question" color="pink">
      <div className="grid gap-3 md:grid-cols-3">
        {cols.map(({ key, title, ph }) => (
          <div key={key} className="rounded border-2 border-red-200 bg-white">
            <div className="bg-pink-100 px-3 py-2 text-sm font-bold">{title}</div>
            <TextAreaField value={v(values, key)} onChange={(val) => onChange(key, val)} placeholder={ph} rows={6} readOnly={readOnly} className="p-3" />
          </div>
        ))}
      </div>
    </SectionBox>
  );
}

/* ── 4Cs ── */
export function FourCsTemplate({ values, onChange, readOnly }: TemplateProps) {
  const items = [
    { key: "connections", label: "Connections (연결)", ph: "텍스트와 내 삶·학습의 연결점은?" },
    { key: "challenge", label: "Challenge (도전)", ph: "의문이나 반박하고 싶은 점은?" },
    { key: "concepts", label: "Concepts (개념)", ph: "기억할 핵심 개념은?" },
    { key: "changes", label: "Changes (변화)", ph: "태도·사고·행동의 변화는?" },
  ];
  return (
    <SectionBox title="The 4 C's" color="blue">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(({ key, label, ph }) => (
          <TextAreaField key={key} label={label} value={v(values, key)} onChange={(val) => onChange(key, val)} placeholder={ph} rows={4} readOnly={readOnly} />
        ))}
      </div>
    </SectionBox>
  );
}

/* ── 5 Why ── */
export function FiveWhyTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="5WHY 활동지" color="yellow">
      <TextAreaField label="주제" value={v(values, "mainTopic")} onChange={(val) => onChange("mainTopic", val)} rows={1} readOnly={readOnly} className="mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="grid gap-2 rounded border border-sky-200 bg-white p-3 md:grid-cols-[60px_1fr_1fr]">
            <span className="flex items-center text-sm font-bold text-sky-700">{n} why</span>
            <TextAreaField label="질문" value={v(values, `q${n}`)} onChange={(val) => onChange(`q${n}`, val)} rows={2} readOnly={readOnly} />
            <TextAreaField label="답" value={v(values, `a${n}`)} onChange={(val) => onChange(`a${n}`, val)} rows={2} readOnly={readOnly} />
          </div>
        ))}
      </div>
      <TextAreaField label="결론" value={v(values, "conclusion")} onChange={(val) => onChange("conclusion", val)} rows={3} readOnly={readOnly} className="mt-4" />
    </SectionBox>
  );
}

/* ── Step Inside ── */
export function StepInsideTemplate({ values, onChange, readOnly }: TemplateProps) {
  const prompts = [
    { key: "see", q: "What can this person or thing see, observe, or notice?" },
    { key: "know", q: "What might they know, understand, hold true, or believe?" },
    { key: "care", q: "What might they care deeply about?" },
    { key: "wonder", q: "What might they wonder about or question?" },
  ];
  return (
    <SectionBox title="Step Inside" color="orange">
      {prompts.map(({ key, q }) => (
        <TextAreaField key={key} label={q} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={3} readOnly={readOnly} className="mb-3" />
      ))}
    </SectionBox>
  );
}

/* ── I Used to Think ── */
export function IUsedToThinkTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="I Used to Think… Now I Think…" color="yellow">
      <TextAreaField label="I used to think… (예전에는…)" value={v(values, "usedToThink")} onChange={(val) => onChange("usedToThink", val)} rows={5} readOnly={readOnly} className="mb-4" />
      <TextAreaField label="Now I think… (지금은…)" value={v(values, "nowThink")} onChange={(val) => onChange("nowThink", val)} rows={5} readOnly={readOnly} />
    </SectionBox>
  );
}

/* ── Plus One ── */
export function PlusOneTemplate({ values, onChange, readOnly }: TemplateProps) {
  const steps = ["recall", "addOne", "repeat", "review", "reflect"];
  const labels: Record<string, string> = {
    recall: "RECALL — 기억나는 핵심 내용",
    addOne: "PASS RIGHT & ADD 1 — 하나 추가하기",
    repeat: "REPEAT — 2번 이상 반복",
    review: "REVIEW — 다른 사람의 추가 검토",
    reflect: "REFLECT — 성찰",
  };
  return (
    <SectionBox title="Plus One (플러스 원)" color="purple">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <TextAreaField value={v(values, "workspace")} onChange={(val) => onChange("workspace", val)} rows={12} readOnly={readOnly} placeholder="생각을 자유롭게 기록하세요" />
        <div className="space-y-2">
          {steps.map((s) => (
            <div key={s} className="rounded border border-slate-200 bg-white p-2">
              <p className="text-xs font-bold text-slate-700">{labels[s]}</p>
              {s === "reflect" && (
                <TextAreaField value={v(values, "reflect")} onChange={(val) => onChange("reflect", val)} rows={3} readOnly={readOnly} className="mt-1" />
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionBox>
  );
}

/* ── Headline ── */
export function HeadlineTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="Headline 활동" color="blue">
      <p className="mb-3 text-sm text-slate-600">오늘 배운 내용을 신문 헤드라인처럼 한 문장으로 정리해보세요.</p>
      <TextAreaField value={v(values, "headline")} onChange={(val) => onChange("headline", val)} placeholder="예: '모인 물방울이 지구를 구한다!'" rows={3} readOnly={readOnly} />
    </SectionBox>
  );
}

/* ── Give 3 Feedback ── */
export function Give3FeedbackTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="Give 3 Feedback Routine" color="blue">
      {[1, 2, 3].map((n) => (
        <TextAreaField key={n} label={`피드백 ${n}`} value={v(values, `feedback${n}`)} onChange={(val) => onChange(`feedback${n}`, val)} rows={3} readOnly={readOnly} className="mb-3" />
      ))}
    </SectionBox>
  );
}

/* ── Ladder of Feedback ── */
export function LadderOfFeedbackTemplate({ values, onChange, readOnly }: TemplateProps) {
  const steps = [
    { key: "clarify", label: "Clarify (명확히)", color: "bg-red-200", ph: "I wonder…" },
    { key: "value", label: "Value (가치)", color: "bg-purple-200", ph: "I value…" },
    { key: "concerns", label: "Questions & Concerns", color: "bg-blue-200", ph: "I wonder…" },
    { key: "suggest", label: "Suggest (제안)", color: "bg-green-200", ph: "What about adding…" },
    { key: "thank", label: "Thank (감사)", color: "bg-yellow-200", ph: "Thank you for…" },
  ];
  return (
    <SectionBox title="Ladder of Feedback" color="pink">
      <div className="space-y-2">
        {steps.map(({ key, label, color, ph }) => (
          <div key={key} className={`rounded-lg border border-slate-200 ${color} p-1`}>
            <TextAreaField label={label} value={v(values, key)} onChange={(val) => onChange(key, val)} placeholder={ph} rows={2} readOnly={readOnly} className="bg-white/80 p-2 rounded" />
          </div>
        ))}
      </div>
    </SectionBox>
  );
}

/* ── Chalk Talk / Hot Spots / Zoom In / Brainstorming — activity sheets ── */
export function ActivitySheetTemplate({
  values,
  onChange,
  readOnly,
  fields,
}: TemplateProps & { fields: { key: string; label: string }[] }) {
  return (
    <div className="space-y-3">
      {fields.map(({ key, label }) => (
        <TextAreaField key={key} label={label} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={4} readOnly={readOnly} />
      ))}
    </div>
  );
}

export function ChalkTalkTemplate(props: TemplateProps) {
  return (
    <SectionBox title="Chalk Talk" color="blue">
      <ActivitySheetTemplate {...props} fields={[
        { key: "writingContext", label: "글쓰기 상황" },
        { key: "activityExample", label: "활동 사례" },
        { key: "activityTip", label: "활동 팁" },
      ]} />
    </SectionBox>
  );
}

export function HotSpotsTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="Hot Spots" color="blue">
      <p className="mb-3 text-sm text-slate-600">사진에서 눈에 띄는 부분과 궁금한 점을 적어보세요.</p>
      {[1, 2].map((n) => (
        <TextAreaField key={n} label={`활동사례 ${n}`} value={v(values, `case${n}`)} onChange={(val) => onChange(`case${n}`, val)} rows={4} readOnly={readOnly} className="mb-3" placeholder="나는 여기가 눈에 띄었어요. 왜냐하면…" />
      ))}
    </SectionBox>
  );
}

export function ZoomInTemplate({ values, onChange, readOnly }: TemplateProps) {
  const steps = [
    { key: "step1", label: "1. 작은 이미지 — 이게 뭘까요?" },
    { key: "step2", label: "2. 조금 더 확대 — 생각을 바꿔야 할까요?" },
    { key: "step3", label: "3. 전체 이미지 — 처음 생각과 뭐가 다른가요?" },
  ];
  return (
    <SectionBox title="Zoom In" color="blue">
      <div className="grid gap-3 md:grid-cols-3">
        {steps.map(({ key, label }) => (
          <TextAreaField key={key} label={label} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={5} readOnly={readOnly} />
        ))}
      </div>
      <TextAreaField label="글쓰기 상황" value={v(values, "writingSituation")} onChange={(val) => onChange("writingSituation", val)} rows={3} readOnly={readOnly} className="mt-4" />
    </SectionBox>
  );
}

export function BrainstormingTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="브레인스토밍" color="pink">
      <div className="mb-4 rounded bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-bold">4가지 원칙: 자유로운 분위기 · 질보다 양 · 비판금지 · 결합과 개선</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <TextAreaField label="아이디어 1" value={v(values, "idea1")} onChange={(val) => onChange("idea1", val)} rows={5} readOnly={readOnly} />
        <TextAreaField label="아이디어 2" value={v(values, "idea2")} onChange={(val) => onChange("idea2", val)} rows={5} readOnly={readOnly} />
      </div>
      <TextAreaField label="종합" value={v(values, "summary")} onChange={(val) => onChange("summary", val)} rows={4} readOnly={readOnly} className="mt-3" />
    </SectionBox>
  );
}

/* ── Exaggeration / Starbursting ── */
export function ExaggerationTemplate({ values, onChange, readOnly }: TemplateProps) {
  const chips = ["만약 1000배 커진다면?", "만약 1000배 작아진다면?", "만약 1000배 빨라진다면?", "만약 사용자가 1000배 늘어난다면?"];
  return (
    <SectionBox title="과장하기 Exaggeration" color="blue">
      {!readOnly && <GuideChips chips={chips} onSelect={(t) => onChange("content", v(values, "content") ? `${v(values, "content")}\n${t}` : t)} />}
      <TextAreaField value={v(values, "content")} onChange={(val) => onChange("content", val)} rows={8} readOnly={readOnly} className="mt-3" placeholder="과장된 질문과 아이디어를 적어보세요" />
    </SectionBox>
  );
}

export function StarburstingTemplate({ values, onChange, readOnly }: TemplateProps) {
  const items = ["who", "what", "when", "where", "why", "how"];
  const labels: Record<string, string> = { who: "Who (누가)", what: "What (무엇)", when: "When (언제)", where: "Where (어디)", why: "Why (왜)", how: "How (어떻게)" };
  return (
    <SectionBox title="스타버스팅 (5W1H)" color="blue">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((key) => (
          <TextAreaField key={key} label={labels[key]} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={3} readOnly={readOnly} />
        ))}
      </div>
    </SectionBox>
  );
}

/* ── Question Types ── */
export function QuestionTypesTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="질문의 종류" color="green">
      <TextAreaField label="탐구질문" value={v(values, "inquiry")} onChange={(val) => onChange("inquiry", val)} rows={2} readOnly={readOnly} className="mb-3" />
      <TextAreaField label="AI 활용 (프롬프트)" value={v(values, "aiPrompt")} onChange={(val) => onChange("aiPrompt", val)} rows={2} readOnly={readOnly} className="mb-3" />
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { key: "fact", label: "사실 질문" },
          { key: "concept", label: "개념 질문" },
          { key: "curiosity", label: "호기심 질문" },
        ].map(({ key, label }) => (
          <TextAreaField key={key} label={label} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={4} readOnly={readOnly} />
        ))}
      </div>
      <TextAreaField label="예상답" value={v(values, "expected")} onChange={(val) => onChange("expected", val)} rows={3} readOnly={readOnly} className="mt-3" />
    </SectionBox>
  );
}

/* ── Question Bank ── */
const QB_SECTIONS = [
  { key: "self", title: "자신에 대한 성찰", qs: ["나의 강점과 약점은?", "학습 목표 달성 정도는?", "참여 태도는?", "가장 흥미로웠던 순간은?", "어떤 점에서 성장했는가?"] },
  { key: "process", title: "탐구과정 성찰", qs: ["새롭게 배운 것은?", "어려움과 극복 방법은?", "탐구 방법의 효과는?", "더 깊이 생각할 부분은?"] },
  { key: "concept", title: "학습한 개념", qs: ["가장 중요한 개념은?", "실생활 적용 방법은?", "다른 교과와의 연결은?", "사고방식의 변화는?", "다른 사람에게 설명할 수 있는가?"] },
  { key: "generalize", title: "일반화", qs: ["더 넓은 맥락에서의 적용은?", "실생활 문제 해결 방법은?", "미래 학습·직업에서의 중요성은?"] },
];

export function QuestionBankTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <div className="space-y-4">
      {QB_SECTIONS.map(({ key, title, qs }) => (
        <SectionBox key={key} title={title} color="green">
          {qs.map((q, i) => (
            <TextAreaField key={i} label={q} value={v(values, `${key}_${i}`)} onChange={(val) => onChange(`${key}_${i}`, val)} rows={2} readOnly={readOnly} className="mb-2" />
          ))}
        </SectionBox>
      ))}
    </div>
  );
}

/* ── Six Thinking Hats ── */
export function SixThinkingHatsTemplate({ values, onChange, readOnly }: TemplateProps) {
  const sections = [
    { key: "white1", label: "문제 정의 (흰색)" },
    { key: "yellow", label: "방향 아이디어 (노란색)" },
    { key: "white2", label: "연구 및 조사 (흰색)" },
    { key: "red", label: "기능과 특징 (빨간색)" },
    { key: "blue", label: "설계 및 제작 (파란색)" },
    { key: "black", label: "위험 및 문제점 (검은색)" },
    { key: "green", label: "창의적 아이디어 (녹색)" },
  ];
  return (
    <SectionBox title="육색 사고 기법" color="purple">
      <TextAreaField label="발명품 이름" value={v(values, "invention")} onChange={(val) => onChange("invention", val)} rows={1} readOnly={readOnly} className="mb-4" />
      {sections.map(({ key, label }) => (
        <TextAreaField key={key} label={label} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={3} readOnly={readOnly} className="mb-2" />
      ))}
    </SectionBox>
  );
}

/* ── Peel the Fruit ── */
export function PeelTheFruitTemplate({ values, onChange, readOnly }: TemplateProps) {
  const layers = [
    { key: "outside", label: "Outside Skin — 무엇이 보이나요?" },
    { key: "under", label: "Under the Skin — 궁금한 점은?" },
    { key: "building", label: "Building Explanations — 진짜 무엇에 관한 것?" },
    { key: "connection", label: "Making a Connection — 내 삶과의 연결?" },
    { key: "viewpoints", label: "Different Viewpoints — 다른 관점은?" },
    { key: "heart", label: "Capturing the Heart — 핵심 메시지는?" },
  ];
  return (
    <SectionBox title="Peel the Fruit" color="orange">
      <div className="grid gap-3 md:grid-cols-2">
        {layers.map(({ key, label }) => (
          <TextAreaField key={key} label={label} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={4} readOnly={readOnly} />
        ))}
      </div>
    </SectionBox>
  );
}

/* ── Circle of Viewpoints ── */
export function CircleOfViewpointsTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="관점의 원" color="orange">
      <TextAreaField label="중심 주제" value={v(values, "centerTopic")} onChange={(val) => onChange("centerTopic", val)} rows={1} readOnly={readOnly} className="mb-4" />
      <TextAreaField label="1. 관점 정하기 — I am thinking from the point of view of…" value={v(values, "viewpoint")} onChange={(val) => onChange("viewpoint", val)} rows={2} readOnly={readOnly} className="mb-2" />
      <TextAreaField label="2. I think… Because…" value={v(values, "think")} onChange={(val) => onChange("think", val)} rows={3} readOnly={readOnly} className="mb-2" />
      <TextAreaField label="3. A question or concern from this viewpoint…" value={v(values, "concern")} onChange={(val) => onChange("concern", val)} rows={3} readOnly={readOnly} />
    </SectionBox>
  );
}

/* ── GSCE ── */
export function GsceTemplate({ values, onChange, readOnly }: TemplateProps) {
  const quadrants = [
    { key: "generate", label: "Generate — 아이디어 떠올리기", color: "border-blue-300" },
    { key: "sort", label: "Sort — 아이디어 분류하기", color: "border-purple-300" },
    { key: "connect", label: "Connect — 아이디어 연결하기", color: "border-blue-300" },
    { key: "elaborate", label: "Elaborate — 아이디어 확장하기", color: "border-purple-300" },
  ];
  return (
    <SectionBox title="Generate · Sort · Connect · Elaborate" color="blue">
      <div className="grid gap-3 sm:grid-cols-2">
        {quadrants.map(({ key, label, color }) => (
          <div key={key} className={`rounded border-2 ${color} bg-white p-2`}>
            <TextAreaField label={label} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={5} readOnly={readOnly} />
          </div>
        ))}
      </div>
      <TextAreaField label="글쓰기 상황" value={v(values, "writingContext")} onChange={(val) => onChange("writingContext", val)} rows={3} readOnly={readOnly} className="mt-3" />
      <TextAreaField label="활동 사례" value={v(values, "activityCase")} onChange={(val) => onChange("activityCase", val)} rows={3} readOnly={readOnly} className="mt-3" />
    </SectionBox>
  );
}

/* ── Stop Light ── */
export function StopLightTemplate({ values, onChange, readOnly }: TemplateProps) {
  const cols = [
    { prefix: "problem", label: "WHAT ARE THE PROBLEMS?", bg: "bg-red-100" },
    { prefix: "affect", label: "WHO DO THEY AFFECT?", bg: "bg-yellow-100" },
    { prefix: "solution", label: "WHAT ARE SOME SOLUTIONS?", bg: "bg-green-100" },
  ];
  return (
    <SectionBox title="STOP Light" color="pink">
      <div className="grid gap-3 md:grid-cols-3">
        {cols.map(({ prefix, label, bg }) => (
          <div key={prefix}>
            <p className="mb-2 text-xs font-bold">{label}</p>
            <GridInput
              keys={Array.from({ length: 6 }, (_, i) => `${prefix}_${i}`)}
              values={values}
              onChange={onChange}
              cols={2}
              readOnly={readOnly}
              cellClass={bg}
            />
          </div>
        ))}
      </div>
      <TextAreaField label="추가 메모" value={v(values, "notes")} onChange={(val) => onChange("notes", val)} rows={3} readOnly={readOnly} className="mt-4" />
    </SectionBox>
  );
}

/* ── Y Chart / T Chart ── */
export function YChartTemplate({ values, onChange, readOnly }: TemplateProps) {
  const sections = [
    { key: "looks", label: "Looks like (보이는 것)" },
    { key: "sounds", label: "Sounds like (들리는 것)" },
    { key: "feels", label: "Feels like (느껴지는 것)" },
  ];
  return (
    <SectionBox title="Y Chart" color="purple">
      <div className="grid gap-3 md:grid-cols-3">
        {sections.map(({ key, label }) => (
          <TextAreaField key={key} label={label} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={5} readOnly={readOnly} />
        ))}
      </div>
      <TextAreaField label="추가 메모" value={v(values, "notes")} onChange={(val) => onChange("notes", val)} rows={3} readOnly={readOnly} className="mt-3" />
    </SectionBox>
  );
}

export function TChartTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="T Chart" color="pink">
      <div className="grid gap-3 md:grid-cols-2">
        <TextAreaField label="What I Know (알게 된 것)" value={v(values, "know")} onChange={(val) => onChange("know", val)} rows={8} readOnly={readOnly} />
        <TextAreaField label="What I Want to Know (알고 싶은 것)" value={v(values, "want")} onChange={(val) => onChange("want", val)} rows={8} readOnly={readOnly} />
      </div>
    </SectionBox>
  );
}

/* ── Brainwriting 635 ── */
export function Brainwriting635Template({ values, onChange, readOnly }: TemplateProps) {
  const gridKeys = Array.from({ length: 18 }, (_, i) => `cell_${i}`);
  return (
    <SectionBox title="Brainwriting 6-3-5 Method" color="purple">
      <TextAreaField label="Issue (문제)" value={v(values, "issue")} onChange={(val) => onChange("issue", val)} rows={2} readOnly={readOnly} className="mb-3" />
      <p className="mb-2 text-xs text-slate-500">6명 × 3아이디어 × 6라운드</p>
      <GridInput keys={gridKeys} values={values} onChange={onChange} cols={3} readOnly={readOnly} />
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <TextAreaField label="Connect/Combine" value={v(values, "connect")} onChange={(val) => onChange("connect", val)} rows={3} readOnly={readOnly} />
        <TextAreaField label="Cluster" value={v(values, "cluster")} onChange={(val) => onChange("cluster", val)} rows={3} readOnly={readOnly} />
        <TextAreaField label="Evaluate" value={v(values, "evaluate")} onChange={(val) => onChange("evaluate", val)} rows={3} readOnly={readOnly} />
      </div>
    </SectionBox>
  );
}

/* ── Spectrum ── */
export function SpectrumTemplate({ values, onChange, readOnly }: TemplateProps) {
  const positions = ["notAtAll", "no", "yes", "veryYes"];
  const labels = ["전혀 아니다", "아니다", "그렇다", "매우 그렇다"];
  return (
    <SectionBox title="스펙트럼 입장문" color="yellow">
      <TextAreaField label="질문/주제" value={v(values, "question")} onChange={(val) => onChange("question", val)} rows={2} readOnly={readOnly} className="mb-4" />
      <div className="relative mb-6 flex items-center justify-between rounded bg-slate-100 px-4 py-8">
        <span>←</span>
        {labels.map((l, i) => (
          <span key={i} className="rounded bg-yellow-200 px-2 py-1 text-xs font-medium">{l}</span>
        ))}
        <span>→</span>
      </div>
      {positions.map((key, i) => (
        <TextAreaField key={key} label={`${labels[i]} — 나의 생각`} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={2} readOnly={readOnly} className="mb-2" />
      ))}
      <TextAreaField label="종합 성찰" value={v(values, "reflection")} onChange={(val) => onChange("reflection", val)} rows={3} readOnly={readOnly} className="mt-3" />
    </SectionBox>
  );
}
