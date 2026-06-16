import type { WorksheetMeta } from "@/lib/types";

/** 활동지 메타 필드 라벨 — WorksheetHeader·마이페이지·교사 대시보드 공통 */
export const META_FIELD_LABELS: Record<keyof WorksheetMeta, string> = {
  grade: "학년",
  classNo: "반",
  studentNo: "번호",
  studentName: "이름",
  topic: "주제",
  unit: "단원",
  period: "차시",
  inquiryQuestion: "탐구질문",
  writingContext: "글쓰기 상황",
  description: "설명",
};

export function getMetaFieldLabel(key: string): string {
  return META_FIELD_LABELS[key as keyof WorksheetMeta] ?? key;
}
