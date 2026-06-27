export const GROUP_COUNT = 6;
export const ROLE_CODES = [1, 2, 3, 4] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_LABELS: Record<RoleCode, string> = {
  1: "이끄미",
  2: "나누미",
  3: "지키미(기록이)",
  4: "깔끄미",
};

export const ROLE_DESCRIPTIONS: Record<RoleCode, string> = {
  1: "사회자, 발표",
  2: "실험 준비물 준비, 배부",
  3: "시간, 안전, 기록",
  4: "모둠 테이블 정리, 태블릿 정리",
};

export const ACHIEVEMENT_LABELS: Record<1 | 2 | 3, string> = {
  1: "상",
  2: "중",
  3: "하",
};

/** 1주차 시작: 2026년 6월 29일(월) */
export const ROLE_WEEK_ANCHOR = "2026-06-29";

/** 학년·반 입력값 정규화 (5학년, 2반 → 5, 2) */
export function normalizeClassPart(value: string): string {
  return value.trim().replace(/학년|반/g, "").trim();
}

/** 번호 정규화 (01 → 1) — 중복 방지용 */
export function normalizeStudentNo(value: string): string {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return String(parseInt(trimmed, 10));
  }
  return trimmed;
}

export function buildRosterId(teacherUid: string, grade: string, classNo: string): string {
  return `${teacherUid}__${normalizeClassPart(grade)}__${normalizeClassPart(classNo)}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function buildRosterStudentId(rosterId: string, studentNo: string): string {
  return `${rosterId}__${normalizeStudentNo(studentNo)}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** 학생 조회용 — 학년·반 키 (Firestore 규칙 getDoc 허용) */
export function buildClassScheduleId(grade: string, classNo: string): string {
  return `${normalizeClassPart(grade)}__${normalizeClassPart(classNo)}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}
