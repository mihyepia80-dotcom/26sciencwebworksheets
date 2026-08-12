import {
  analyzeSlot,
  extractKeywordsFromSlots,
  josa,
  mergeSlotContext,
  stripObjectParticle,
} from "./keywords";
import type { QbSlots } from "./types";

function formatChangePhrase(change: string, observedText: string): string {
  const c = stripObjectParticle(change);
  const obs = analyzeSlot(observedText);

  if (/온도|따뜻|차갑|뜨거/.test(c)) {
    if (c.includes("의") || c.includes("물")) return c;
    if (obs.medium) return `${obs.medium}의 온도`;
    return c.includes("온도") ? c : `${c} 온도`;
  }
  if (/종류/.test(c)) return c.includes("용질") ? c : `용질의 종류`;
  if (/양|많|적|크|작|숟|스푼/.test(c)) {
    if (obs.substance) return `${obs.substance}의 양`;
    return c.includes("양") ? c : `${c}의 양`;
  }
  if (/설탕|소금|용질/.test(c) && !c.includes("종류")) {
    return `넣는 ${c}의 종류`;
  }
  return c;
}

function formatMeasurePhrase(measure: string, observedText: string, changeText: string): string {
  const m = stripObjectParticle(measure);
  const obs = analyzeSlot(observedText);
  const ch = analyzeSlot(changeText);

  if (/빠르|느리/.test(m)) {
    if (obs.substance) return `${obs.substance}이 녹는 빠르기`;
    return m.includes("기") ? m : `${m}기`;
  }
  if (/무게/.test(m)) {
    if (obs.substance && obs.medium) return `${obs.medium}과 ${obs.substance}의 무게`;
    return "무게";
  }
  if (/진하/.test(m)) {
    if (obs.substance) return `${obs.substance} ${obs.medium ?? "용액"}의 진하기`;
    return "용액의 진하기";
  }
  if (/양|용해/.test(m) && obs.substance) {
    return `${obs.substance} 용해량`;
  }
  if (ch.measureHint && m.length <= 4) {
    return `${obs.substance ? `${obs.substance} ` : ""}${m.includes("기") || m.includes("량") ? m : `${m} 정도`}`;
  }
  return m;
}

/** 키워드·문맥 기반 탐구 질문 문장 (규칙, 토큰 0) */
export function assembleInquiryQuestion(slots: QbSlots): string {
  const change = slots.change.trim();
  const measure = slots.measure.trim();
  if (!change || !measure) return "";

  const changePhrase = formatChangePhrase(change, slots.observed);
  const measurePhrase = formatMeasurePhrase(measure, slots.observed, change);

  if (/일\s*때와|과\s*.*과|비교|두\s*가지|A.*B/.test(change)) {
    return `${changePhrase}일 때 ${josa(measurePhrase, ["은", "는"])} 어떻게 다를까?`;
  }
  if (/늘리|줄이|많|적|크|작|높|낮/.test(change)) {
    return `${changePhrase}면 ${measurePhrase}도 달라질까?`;
  }
  if (/온도|따뜻|차갑|뜨거/.test(change)) {
    return `${changePhrase}${josa(changePhrase, ["을", "를"])} 바꾸면 ${josa(measurePhrase, ["은", "는"])} 어떻게 달라질까?`;
  }
  return `${changePhrase}${josa(changePhrase, ["을", "를"])} 바꾸면 ${josa(measurePhrase, ["은", "는"])} 어떻게 될까?`;
}

/** 대안 탐구 질문 1개 (후보·AI 보조용) */
export function assembleInquiryQuestionVariant(slots: QbSlots): string {
  const change = slots.change.trim();
  const measure = slots.measure.trim();
  if (!change || !measure) return "";

  const ctx = mergeSlotContext(slots);
  const changePhrase = formatChangePhrase(change, slots.observed);
  const measurePhrase = formatMeasurePhrase(measure, slots.observed, change);

  if (ctx.observed.substance && /온도/.test(change)) {
    return `${ctx.observed.substance}${josa(ctx.observed.substance, ["이", "가"])} ${ctx.observed.medium ?? "물"}에 녹는 양은 ${changePhrase}${josa(changePhrase, ["을", "를"])} 바꾸면 달라질까?`;
  }
  if (ctx.observed.substance) {
    return `${changePhrase}에 따라 ${ctx.observed.substance} ${measurePhrase}${josa(measurePhrase, ["은", "는"])} 어떻게 변할까?`;
  }
  return `${changePhrase}와 ${measurePhrase} 사이에 어떤 관계가 있을까?`;
}

export function buildRuleCandidates(slots: QbSlots): [string, string] | [] {
  const main = assembleInquiryQuestion(slots);
  if (!main) return [];
  const alt = assembleInquiryQuestionVariant(slots);
  if (!alt || alt === main) return [main, `${stripObjectParticle(slots.change)}를 바꾸면 ${stripObjectParticle(slots.measure)}${josa(stripObjectParticle(slots.measure), ["은", "는"])} 어떻게 될까?`];
  return [main, alt];
}

/** AI·대화용 키워드 요약 (최소 토큰) */
export function summarizeSlotsForPrompt(slots: QbSlots): string {
  const kw = extractKeywordsFromSlots(slots);
  return kw.length ? kw.join(",") : "없음";
}
