import { QB_CHAT_STEPS } from "@/components/worksheet/QuestionSlotFields";
import { analyzeSlot, extractKeywords, mergeSlotContext } from "./keywords";
import { assembleInquiryQuestion } from "./question-assembler";
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

function keywordEcho(text: string): string {
  const kw = extractKeywords(text, 3);
  return kw.length ? kw.join(" · ") : "";
}

function inferFromObserved(observed: string): {
  changeQuestion: string;
  changePlaceholder: string;
  ack: string;
} {
  const q = quotePhrase(observed);
  const ctx = analyzeSlot(observed);
  const echo = keywordEcho(observed);

  if (!q) {
    return {
      changeQuestion: QB_CHAT_STEPS[1].prompt,
      changePlaceholder: QB_CHAT_STEPS[1].placeholder,
      ack: "관찰 내용을 잘 적어 줬어!",
    };
  }

  const ackParts: string[] = [];
  if (echo) ackParts.push(echo);
  if (ctx.phenomenon && ctx.substance) {
    ackParts.push(`${ctx.substance}이(가) ${ctx.medium ?? "물"}에서 ${ctx.phenomenon}는 모습`);
  } else if (ctx.phenomenon) {
    ackParts.push(`${ctx.phenomenon} 현상`);
  }
  const ackBody = ackParts.length ? ackParts.join(" — ") : "그걸 봤구나";
  const ack = `${q} — ${ackBody}!`;

  let changeQuestion: string;
  let changePlaceholder: string;

  if (ctx.substance && ctx.phenomenon) {
    changeQuestion = `${ctx.substance}이(가) ${ctx.medium ?? "물"}에 ${ctx.phenomenon}는 것을 봤으니, ${ctx.medium ?? "물"}의 온도와 ${ctx.substance}의 양 중 무엇을 바꿔 볼까?`;
    changePlaceholder = "예: 물의 온도";
  } else if (/온도|따뜻|차갑|뜨거/.test(observed)) {
    changeQuestion = `${q} — 온도가 달라졌네. 이번엔 ${ctx.substance ? `${ctx.substance}의 양` : "용질의 종류"}나 ${ctx.substance ? "용질의 종류" : "용질의 양"} 중 무엇을 바꿔 볼까?`;
    changePlaceholder = ctx.substance ? `${ctx.substance}의 양` : "예: 용질의 종류";
  } else if (/무게|저울|그램|g\b/.test(observed)) {
    changeQuestion = `${q} — 무게 변화를 봤구나. ${ctx.substance ? `${ctx.substance}의 양` : "넣는 용질의 양"}이나 ${ctx.medium ?? "물"}의 온도 중 무엇을 바꿔 볼까?`;
    changePlaceholder = "예: 넣는 용질의 양";
  } else if (/녹|용해|진하/.test(observed)) {
    changeQuestion = `${q} — 용해와 관련된 관찰이네. ${ctx.medium ?? "물"}의 온도나 ${ctx.substance ?? "용질"}의 양 중 무엇을 바꿔 볼까?`;
    changePlaceholder = "예: 물의 온도";
  } else {
    changeQuestion = `${q}을(를) 봤으니, ${ctx.variableHint ?? "실험 조건"} 중 무엇을 바꿔 보면 더 알 수 있을까?`;
    changePlaceholder = ctx.variableHint ?? "예: 물의 온도";
  }

  return { ack, changeQuestion, changePlaceholder };
}

function suggestMeasureOptions(observed: string, change: string): string {
  const obs = analyzeSlot(observed);
  const ch = analyzeSlot(change);

  if (/온도|따뜻|차갑|뜨거/.test(change)) {
    return obs.substance ? `${obs.substance}이 녹는 빠르기` : "녹는 빠르기";
  }
  if (/양|많|적|크|작/.test(change)) {
    return obs.substance ? `${obs.substance} 용해량` : "용해량";
  }
  if (/종류|설탕|소금/.test(change)) {
    return "용해량이나 진하기";
  }
  if (ch.measureHint) return ch.measureHint;
  if (obs.phenomenon === "녹") return obs.substance ? `${obs.substance}이 녹는 정도` : "녹는 정도";
  return "변하는 정도";
}

function inferFromChange(change: string, observed: string): {
  measureQuestion: string;
  measurePlaceholder: string;
  ack: string;
} {
  const c = quotePhrase(change);
  const obs = analyzeSlot(observed);
  const suggest = suggestMeasureOptions(observed, change);

  if (!c) {
    return {
      ack: "바꿀 조건을 잘 골랐어!",
      measureQuestion: QB_CHAT_STEPS[2].prompt,
      measurePlaceholder: QB_CHAT_STEPS[2].placeholder,
    };
  }

  const ack = obs.substance
    ? `${c}을(를) 바꿔 보면, ${obs.substance}에 어떤 변화가 생길지 이어서 생각해 보자.`
    : `${c}을(를) 바꿔 본다면…`;

  let measureQuestion: string;
  if (obs.substance && obs.phenomenon) {
    measureQuestion = `${obs.substance}이(가) ${obs.medium ?? "물"}에 ${obs.phenomenon}는 상황에서 ${c}을(를) 바꾸면, ${suggest} 중 무엇을 관찰·측정할까?`;
  } else if (observed.trim()) {
    measureQuestion = `${quotePhrase(observed, 22)}을(를) 본 상태에서 ${c}을(를) 바꾸면, ${suggest} 중 무엇을 볼까?`;
  } else {
    measureQuestion = `${c}을(를) 바꾸면, ${suggest} 중 무엇이 달라지는지 볼까?`;
  }

  return {
    ack,
    measureQuestion,
    measurePlaceholder: suggest.includes("·") ? "예: 용해량" : `예: ${suggest}`,
  };
}

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
  if (!q || !slots) return "볼 것도 잘 정했어! 이제 질문을 만들어 볼게.";

  const ctx = mergeSlotContext(slots);
  const preview = assembleInquiryQuestion(slots);
  const kw = ctx.keywords.slice(0, 3).join(" · ");

  if (preview) {
    return kw
      ? `${kw} — 이 키워드로 탐구 질문을 만들었어.\n\n${preview}`
      : `세 답을 모아 이렇게 탐구 질문을 만들었어.\n\n${preview}`;
  }
  return `${q}을(를) 보면 되겠네. 세 답을 모아 탐구 질문을 만들어 볼게!`;
}

export function buildDraftMessage(slots: QbSlots, draft: string): string {
  const ctx = mergeSlotContext(slots);
  const kw = ctx.keywords.slice(0, 4).join(" · ");
  const bridge = kw ? `네가 말한 ${kw}을(를) 바탕으로…\n\n` : "";

  return `${bridge}이렇게 탐구 질문을 만들었어:\n\n${draft}\n\n마음에 들면 아래 「이 질문으로」를 눌러 줘.`;
}

export function buildIntroMessage(): string {
  return (
    "안녕! 나는 탐구질문 도우미 톡톡이야.\n" +
    "네 답 속 핵심 단어를 듣고, 그다음 질문을 이어서 물어볼 거야.\n" +
    "(관찰 → 바꿀 것 → 볼 것 → 탐구 질문)\n" +
    "정답은 알려주지 않아 — 네 말로 완전한 질문 문장을 만들어 보자!"
  );
}

export function buildConfirmedMessage(question: string): string {
  return `✓ 탐구 질문 확정: ${question.trim()}\n이제 아래 사고 활동지를 작성해 보자!`;
}

export function buildComposerPlaceholder(step: QbStructuredStep, slots: QbSlots): string {
  if (step === "change" && slots.observed.trim()) {
    return inferFromObserved(slots.observed).changePlaceholder;
  }
  if (step === "measure" && slots.change.trim()) {
    return inferFromChange(slots.change, slots.observed).measurePlaceholder;
  }
  return QB_CHAT_STEPS.find((s) => s.key === step)?.placeholder ?? "답변을 입력하세요";
}

export function contextualizeProbe(probe: string, slots: QbSlots): string {
  const p = probe.trim();
  if (!p) return p;

  const ctx = mergeSlotContext(slots);
  const anchorKw = ctx.keywords[0];
  if (!anchorKw) return p;
  if (p.includes(anchorKw)) return p;

  const step = !slots.observed.trim() ? "observed" : !slots.change.trim() ? "change" : "measure";
  const prefix =
    step === "change"
      ? `${anchorKw}을(를) 봤으니, `
      : step === "measure"
        ? `${ctx.change.keywords[0] || anchorKw}을(를) 바꾸면, `
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
  const lines: QbChatLine[] = [{ id: "intro", role: "bot", text: buildIntroMessage() }];

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

  const draft = assembleInquiryQuestion(slots);
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
