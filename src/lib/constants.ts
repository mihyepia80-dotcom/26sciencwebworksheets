export const STUDENT_PASSWORD = process.env.NEXT_PUBLIC_STUDENT_PASSWORD ?? "2600";
export const TEACHER_PASSWORD = process.env.NEXT_PUBLIC_TEACHER_PASSWORD ?? "260026";
export const STUDENT_EMAIL_DOMAIN = "sagodogu-student.app";

/** Firebase Auth는 6자 이상 필요 — 학생은 STUDENT_PASSWORD(2600)만 입력 */
export function getFirebaseStudentPassword(): string {
  return `${STUDENT_PASSWORD}@sagodogu`;
}
