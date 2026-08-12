import type { ToolCategory } from "@/lib/types";

export const CATEGORY_ORDER: ToolCategory[] = [
  "concept-exploration",
  "concept-formation",
  "concept-synthesis",
  "concept-deepening",
  "feedback-support",
  "self-reflection",
  "student-exchange",
];

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  "concept-exploration": "① 개념 소개 및 탐색",
  "concept-formation": "② 개념 형성",
  "concept-synthesis": "③ 개념 종합 및 정리",
  "concept-deepening": "④ 개념 심화",
  "feedback-support": "⑤ 피드백 지원",
  "self-reflection": "⑥ 자기성찰",
  "student-exchange": "⑦ 학생교류",
};

/** 카테고리 빠른 이동·칩용 짧은 라벨 */
export const CATEGORY_SHORT_LABELS: Record<ToolCategory, string> = {
  "concept-exploration": "탐색",
  "concept-formation": "형성",
  "concept-synthesis": "종합",
  "concept-deepening": "심화",
  "feedback-support": "피드백",
  "self-reflection": "성찰",
  "student-exchange": "교류",
};

export const CATEGORY_SUBTITLES: Partial<Record<ToolCategory, string>> = {
  "concept-exploration": "개념을 소개하고 탐색하는 사고기법",
  "concept-formation": "개념어를 비교·연결하며 형성하는 사고기법",
  "concept-synthesis": "개념을 종합하고 정리하는 사고기법",
  "concept-deepening": "개념을 심화하는 사고기법",
  "feedback-support": "동료·교사 피드백을 지원하는 사고기법",
  "self-reflection": "학습을 돌아보는 자기성찰 사고기법",
  "student-exchange": "학생 간 교류·협력 사고기법",
};

export function compareByCategory(a: ToolCategory, b: ToolCategory): number {
  return CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b);
}
