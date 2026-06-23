import type { User } from "firebase/auth";
import type { AuthRole } from "@/lib/firebase";

export function isLoggedInStudent(user: User | null, role: AuthRole): boolean {
  return Boolean(user && role === "student");
}

export function isGuest(user: User | null, role: AuthRole): boolean {
  return !user && role !== "teacher";
}

export function canPersistStudentWork(user: User | null, role: AuthRole): boolean {
  return isLoggedInStudent(user, role);
}

/** 학생·비로그인 체험 — 교사 미리보기(AI 패널 등)와 구분 */
export function isWorksheetEditorMode(user: User | null, role: AuthRole): boolean {
  return isLoggedInStudent(user, role) || isGuest(user, role);
}

export function isTeacherRoute(pathname: string): boolean {
  return pathname === "/teacher" || pathname.startsWith("/teacher/");
}

export function isGuestBrowsablePath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/workspace" ||
    pathname === "/inquiry-report" ||
    pathname.startsWith("/templates/") ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/join/") ||
    pathname.startsWith("/inquiry-report/view/")
  );
}
