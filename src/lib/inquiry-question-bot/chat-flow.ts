import { QB_CHAT_STEPS } from "@/components/worksheet/QuestionSlotFields";
import { assembleQuestion } from "./slot-rules";
import type { QbSlots } from "./types";

export interface QbChatLine {
  id: string;
  role: "bot" | "user" | "system";
  text: string;
}

export type QbStructuredStep = "observed" | "change" | "measure";

function clipPhrase(text: string, max = 28): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function quotePhrase(text: string, max = 28): string {
  const clipped = clipPhrase(text, max);
  return clipped ? `「${clipped}」` : "";
}

/** 관찰 내용 키워드 — 후속 구조화 질문·placeholder 힌트 */
function inferFromObserved(observed: string): {
  changeQuestion: string;
  changePlaceholder: string;
  ack: string;
} {
  const q = quotePhrase(observed);
  if (!q) {
    return {
      changeQuestion: QB_CHAT_STEPS[1].prompt,
      changePlaceholder: QB_CHAT_STEPS[1].placeholder,
      ack: "관찰 내용을 잘 적어 줬어!",
    };
  }

  if (/온도|따뜻|차갑|뜨거|미지근/.test(observed)) {
    return {
      ack: `${q} — 온도와 관련된 관찰이네!`,
      changeQuestion: `${q}을(를) 봤으니, 이번엔 용질의 종류나 양 중 무엇을 바꿔 볼까?`,
      changePlaceholder: "예: 용질의 종류",
    };
  }
  if (/무게|저울|그램|g\b|달라지/.test(observed)) {
    return {
      ack: `${q} — 무게와 관련된 관찰이구나!`,
      changeQuestion: `${q}을(를) 봤으니, 어떤 조건을 바꿔 보면 무게 변화를 더 알 수 있을까?`,
      changePlaceholder: "예: 넣는 용질의 양",
    };
  }
  if (/녹|용해|설탕|소금|용액|물에|진하/.test(observed)) {
    return {
      ack: `${q} — 용해와 관련된 관찰이네!`,
      changeQuestion: `${q}을(를) 봤으니, 물의 온도나 용질의 양 중 무엇을 바꿔 볼까?`,
      changePlaceholder: "예: 물의 온도",
    };
  }
  if (/색|투명|탁|변/.test(observed)) {
    return {
      ack: `${q} — 눈으로 본 변화가 분명하네!`,
      changeQuestion: `${q}을(를) 봤으니, 실험에서 무엇을 바꿔 보면 그 변화를 더 알 수 있을까?`,
      changePlaceholder: "예: 넣는 물질의 양",
    };
  }

  return {
    ack: `${q} — 그걸 봤구나!`,
    changeQuestion: `${q}을(를) 봤으니, 실험에서 무엇을 바꿔 보면 더 알 수 있을까?`,
    changePlaceholder: "예: 물의 온도",
  };
}

function inferFromChange(change: string, observed: string): {
  measureQuestion: string;
  measurePlaceholder: string;
  ack: string;
} {
  const c = quotePhrase(change);
  const o = quotePhrase(observed, 22);

  if (!c) {
    return {
      ack: "바꿀 조건을 잘 골랐어!",
      measureQuestion: QB_CHAT_STEPS[2].prompt,
      measurePlaceholder: QB_CHAT_STEPS[2].placeholder,
    };
  }

  if (/온도|따뜻|차갑|뜨거/.test(change)) {
    return {
      ack: `${c}을(를) 바꿔 본다면…`,
      measureQuestion: o
        ? `${o}을(를) 본 상태에서 ${c}을(를) 바꾸면, 녹는 양이나 빠르기 중 무엇을 볼까?`
        : `${c}을(를) 바꾸면, 녹는 양이나 빠르기 중 무엇이 달라지는지 볼까?`,
      measurePlaceholder: "예: 녹는 빠르기",
    };
  }
  if (/양|많|적|크|작|숟|스푼/.test(change)) {
    return {
      ack: `${c}을(를) 조절해 본다면…`,
      measureQuestion: o
        ? `${o}과(와) ${c}을(를) 함께 생각하면, 무엇이 어떻게 달라지는지 관찰·측정할 수 있을까?`
        : `${c}을(를) 바꾸면, 무엇이 어떻게 달라지는지 볼까?`,
      measurePlaceholder: "예: 용해량",
    };
  }
  if (/종류|설탕|소금|가루|용질/.test(change)) {
    return {
      ack: `${c}을(를) 바꿔 본다면…`,
      measureQuestion: o
        ? `${o}을(를) 본 상태에서 ${c}을(를) 바꾸면, 용해량이나 진하기 중 무엇을 비교해 볼까?`
        : `${c}을(를) 바꾸면, 용해량이나 진하기 중 무엇을 볼까?`,
      measurePlaceholder: "예: 용해량",
    };
  }

  return {
    ack: `${c}을(를) 바꿔 본다면…`,
    measureQuestion: o
      ? `${o}과(와) ${c}을(를) 함께 생각하면, 무엇이 어떻게 달라지는지 관찰·측정할 수 있을까?`
      : `${c}을(를) 바꿨을 때, 무엇이 어떻게 달라지는지 볼까?`,
    measurePlaceholder: "예: 변하는 정도",
  };
}

/** 현재 단계에서 봇이 던지는 구조화 질문 (입력창·대화 공통) */
export function getActiveStructuredQuestion(step: QbStructuredStep, slots: QbSlots): string {
  switch (step) {
    case "observed":
      return buildObservedQuestion();
    case "change":
      return inferFromObserved(slots.observed).changeQuestion;
    case "measure":
      return inferFromChange(slots.change, slots.observed).measureQuestion;
  }
}

export function buildObservedQuestion(): string {
  return "먼저, 실험이나 관찰에서 무엇을 보았는지 알려 줄래?";
}

export function buildObservedAck(observed: string): string {
  return inferFromObserved(observed).ack;
}

export function buildChangeQuestion(observed: string): string {
  return inferFromObserved(observed).changeQuestion;
}

export function buildChangeAck(change: string): string {
  return inferFromChange(change, "").ack;
}

export function buildMeasureQuestion(change: string, observed = ""): string {
  return inferFromChange(change, observed).measureQuestion;
}

export function buildMeasureAck(measure: string, slots?: QbSlots): string {
  const q = quotePhrase(measure);
  if (!q) return "볼 것도 잘 정했어! 이제 질문을 만들어 볼게.";
  if (slots?.observed.trim() && slots.change.trim()) {
    const o = quotePhrase(slots.observed, 18);
    const c = quotePhrase(slots.change, 14);
    return `${q}을(를) 보면 되겠네. ${o} · ${c} · ${q} — 세 답을 모아 질문을 만들어 볼게!`;
  }
  return `${q}을(를) 보면 되겠네. 세 답을 모아 탐구 질문을 만들어 볼게!`;
}

export function buildDraftMessage(slots: QbSlots, draft: string): string {
  const o = quotePhrase(slots.observed, 20);
  const c = quotePhrase(slots.change, 16);
  const m = quotePhrase(slots.measure, 16);

  const bridge =
    o && c && m
      ? `네가 말한 ${o}을(를) 보고, ${c}을(를) 바꿔 ${m}을(를) 보면…\n\n`
      : "";

  return `${bridge}이렇게 탐구 질문을 만들었어:\n\n${draft}\n\n마음에 들면 아래 「이 질문으로」를 눌러 줘.`;
}

export function buildIntroMessage(): string {
  return (
    "안녕! 나는 탐구질문 도우미 톡톡이야.\n" +
    "네 답을 듣고 그다음 **구조화 질문**을 이어서 물어볼 거야.\n" +
    "(관찰 → 바꿀 것 → 볼 것)\n" +
    "정답은 알려주지 않아 — 네 말로 탐구 질문을 완성해 보자!"
  );
}

export function buildConfirmedMessage(question: string): string {
  return `✓ 탐구 질문 확정: ${question.trim()}\n이제 아래 사고 활동지를 작성해 보자!`;
}

/** 입력창 placeholder — 직전 답변 맥락 반영 */
export function buildComposerPlaceholder(step: QbStructuredStep, slots: QbSlots): string {
  if (step === "change" && slots.observed.trim()) {
    return inferFromObserved(slots.observed).changePlaceholder;
  }
  if (step === "measure" && slots.change.trim()) {
    return inferFromChange(slots.change, slots.observed).measurePlaceholder;
  }
  return QB_CHAT_STEPS.find((s) => s.key === step)?.placeholder ?? "답변을 입력하세요";
}

/** AI·규칙 probe를 현재 슬롯 맥락과 연결 */
export function contextualizeProbe(probe: string, slots: QbSlots): string {
  const p = probe.trim();
  if (!p) return p;

  const observed = slots.observed.trim();
  const change = slots.change.trim();
  const anchor = observed ? quotePhrase(observed, 22) : change ? quotePhrase(change, 18) : "";

  if (!anchor) return p;
  if (p.includes(anchor.replace(/「|」/g, ""))) return p;

  const step = !observed ? "observed" : !change ? "change" : "measure";
  const prefix =
    step === "change"
      ? `${anchor}을(를) 봤으니, `
      : step === "measure"
        ? `${quotePhrase(change, 16) || anchor}을(를) 생각하면, `
        : "";

  if (prefix && !p.startsWith(prefix)) {
    const merged = `${prefix}${p.charAt(0).toLowerCase()}${p.slice(1)}`;
    return merged.length <= 80 ? merged : p;
  }
  return p;
}

export function buildConversationalChatLines(options: {
  slots: QbSlots;
  confirmed: boolean;
  inquiryQuestion?: string;
  probe?: string | null;
}): QbChatLine[] {
  const { slots, confirmed, inquiryQuestion, probe } = options;
  const lines: QbChatLine[] = [{ id: "intro", role: "bot", text: buildIntroMessage().replace(/\*\*/g, "") }];

  const observed = slots.observed.trim();
  const change = slots.change.trim();
  const measure = slots.measure.trim();
  const contextualProbe = probe ? contextualizeProbe(probe, slots) : null;

  lines.push({ id: "ask-observed", role: "bot", text: buildObservedQuestion() });

  if (!observed) {
    if (contextualProbe) lines.push({ id: "probe", role: "bot", text: contextualProbe });
    return lines;
  }

  lines.push({ id: "ans-observed", role: "user", text: observed });
  lines.push({ id: "ack-observed", role: "bot", text: buildObservedAck(observed) });
  lines.push({ id: "ask-change", role: "bot", text: buildChangeQuestion(observed) });

  if (!change) {
    if (contextualProbe) lines.push({ id: "probe", role: "bot", text: contextualProbe });
    return lines;
  }

  lines.push({ id: "ans-change", role: "user", text: change });
  lines.push({ id: "ack-change", role: "bot", text: inferFromChange(change, observed).ack });
  lines.push({ id: "ask-measure", role: "bot", text: buildMeasureQuestion(change, observed) });

  if (!measure) {
    if (contextualProbe) lines.push({ id: "probe", role: "bot", text: contextualProbe });
    return lines;
  }

  lines.push({ id: "ans-measure", role: "user", text: measure });
  lines.push({ id: "ack-measure", role: "bot", text: buildMeasureAck(measure, slots) });

  const draft = assembleQuestion(slots);
  if (draft && !confirmed) {
    lines.push({ id: "draft", role: "bot", text: buildDraftMessage(slots, draft) });
  }

  if (contextualProbe && !confirmed && measure) {
    lines.push({ id: "probe", role: "bot", text: contextualProbe });
  }

  if (confirmed && inquiryQuestion?.trim()) {
    lines.push({
      id: "confirmed",
      role: "system",
      text: buildConfirmedMessage(inquiryQuestion),
    });
  }

  return lines;
}
