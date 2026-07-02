export { ACCESS_PIN_HINT, ACCESS_PIN_LENGTH, ACCESS_PIN_PATTERN, isValidAccessPin, normalizeAccessPin } from "@/lib/auth/pin";
export const STUDENT_EMAIL_DOMAIN = "sagodogu-student.app";

/** @deprecated 클라이언트 공개 암호는 사용하지 않습니다. 교사가 설정한 6자리 암호를 사용합니다. */
export const STUDENT_PASSWORD = "";
/** @deprecated 공유 교사 계정 방식은 사용하지 않습니다. */
export const TEACHER_PASSWORD = "";
/** @deprecated Google OAuth per-teacher 계정을 사용합니다. */
export const TEACHER_EMAIL_DOMAIN = "sagodogu-teacher.app";
/** @deprecated */
export const TEACHER_ACCOUNT_EMAIL = `teacher@${TEACHER_EMAIL_DOMAIN}`;
