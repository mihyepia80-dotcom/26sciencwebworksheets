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
  /** 공통 헤더: 실험 과정·관찰·측정 결과 기록란 (필드 키 writingContext 유지) */
  writingContext: "실험 과정·결과 기록",
  description: "설명",
};

/** 입력 placeholder — 라벨과 별도로 안내 문구 제공 */
export const META_FIELD_PLACEHOLDERS: Partial<Record<keyof WorksheetMeta, string>> = {
  writingContext: "실험 과정, 변인 통제, 관찰·측정 결과를 기록하세요",
};

export function getMetaFieldLabel(key: string): string {
  return META_FIELD_LABELS[key as keyof WorksheetMeta] ?? key;
}

export function getMetaFieldPlaceholder(key: keyof WorksheetMeta): string {
  return META_FIELD_PLACEHOLDERS[key] ?? `${getMetaFieldLabel(key)}을(를) 입력하세요`;
}
