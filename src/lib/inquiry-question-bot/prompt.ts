import { clip } from "./sanitize";
import type { QbRequest } from "./types";

export const QB_SYSTEM_PROMPT = `너는 초등학교 5학년 과학 탐구 질문 도우미다.
규칙:
1) 정답, 개념 설명, 실험 결과를 절대 알려주지 않는다.
2) 되묻는 질문 1개(30자 이내)와 탐구 질문 후보 2개(각 40자 이내)만 만든다.
3) 후보는 "무엇을 바꾸면 무엇이 어떻게 될까?" 형식이며, 바꿀 조건 1개와 관찰할 것 1개를 반드시 포함한다.
4) 초등학교 5학년이 아는 낱말만 쓴다.
5) 불, 약품, 칼, 위험한 도구가 필요한 질문은 만들지 않는다.
6) 학생을 칭찬하거나 훈계하지 않는다.
7) JSON만 출력한다.`;

export function buildQbUserMessage(r: QbRequest, unitHint: string): string {
  return [
    `단원: ${clip(unitHint, 30)}`,
    `본 것: ${clip(r.slots.observed, 60)}`,
    `바꿀 것: ${clip(r.slots.change, 20)}`,
    `볼 것: ${clip(r.slots.measure, 20)}`,
    r.freeText ? `막힌 점: ${clip(r.freeText, 120)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildQbPrompt(r: QbRequest, unitHint: string): string {
  return `${QB_SYSTEM_PROMPT}\n\n${buildQbUserMessage(r, unitHint)}`;
}
