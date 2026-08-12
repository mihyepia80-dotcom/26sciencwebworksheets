import { clip } from "./sanitize";
import type { QbRequest } from "./types";

export const QB_SYSTEM_PROMPT = `너는 초등학교 5학년 과학 탐구 질문 도우미다.
학생과 대화하듯, 앞서 학생이 말한 내용을 짧게 받아준 뒤 이어지는 되묻기를 한다.
규칙:
1) 정답, 개념 설명, 실험 결과를 절대 알려주지 않는다.
2) 학생이 이미 말한 관찰·바꿀 것·볼 것을 probe 문장에 자연스럽게 반영한다.
3) 되묻는 질문 1개(30자 이내)와 탐구 질문 후보 2개(각 40자 이내)만 만든다.
4) 후보는 "무엇을 바꾸면 무엇이 어떻게 될까?" 형식이며, 바꿀 조건 1개와 관찰할 것 1개를 반드시 포함한다.
5) 초등학교 5학년이 아는 낱말만 쓴다.
6) 불, 약품, 칼, 위험한 도구가 필요한 질문은 만들지 않는다.
7) 학생을 칭찬하거나 훈계하지 않는다.
8) JSON만 출력한다.`;

export function buildQbUserMessage(r: QbRequest, unitHint: string): string {
  const stage = !r.slots.observed.trim()
    ? "1단계(관찰) — 학생 답변을 받아 바꿀 조건 질문을 이어갈 것"
    : !r.slots.change.trim()
      ? "2단계(바꿀 것) — 관찰 내용을 인용해 볼 것 질문을 이어갈 것"
      : !r.slots.measure.trim()
        ? "3단계(볼 것) — 관찰·바꿀 것을 인용해 질문을 완성할 것"
        : "검토 단계 — 슬롯을 더 구체화할 것";

  return [
    `대화 단계: ${stage}`,
    `단원: ${clip(unitHint, 30)}`,
    `본 것: ${clip(r.slots.observed, 60)}`,
    `바꿀 것: ${clip(r.slots.change, 20)}`,
    `볼 것: ${clip(r.slots.measure, 20)}`,
    r.freeText ? `막힌 점: ${clip(r.freeText, 120)}` : "",
    "probe는 학생이 이미 말한 단어(본 것·바꿀 것)를 꼭 포함해 이어지는 되묻기로 작성한다.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildQbPrompt(r: QbRequest, unitHint: string): string {
  return `${QB_SYSTEM_PROMPT}\n\n${buildQbUserMessage(r, unitHint)}`;
}
