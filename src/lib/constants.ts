export const STUDENT_PASSWORD = process.env.NEXT_PUBLIC_STUDENT_PASSWORD?.trim() || "2600";
export const TEACHER_PASSWORD = process.env.NEXT_PUBLIC_TEACHER_PASSWORD?.trim() || "260026";
export const STUDENT_EMAIL_DOMAIN = "sagodogu-student.app";
export const TEACHER_EMAIL_DOMAIN = "sagodogu-teacher.app";
export const TEACHER_ACCOUNT_EMAIL = `teacher@${TEACHER_EMAIL_DOMAIN}`;

/** Firebase Auth는 6자 이상 필요 — 학생은 공통 암호만 입력 */
export function getFirebaseStudentPassword(): string {
  return `${STUDENT_PASSWORD}@sagodogu`;
}

/** Firebase Auth는 6자 이상 필요 — 교사는 TEACHER_PASSWORD만 입력 */
export function getFirebaseTeacherPassword(): string {
  return `${TEACHER_PASSWORD}@sagodogu`;
}
