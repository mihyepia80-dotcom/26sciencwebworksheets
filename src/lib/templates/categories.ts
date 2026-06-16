import type { ToolCategory } from "@/lib/types";

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

export function compareByCategory(a: ToolCategory, b: ToolCategory): number {
  return CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b);
}
