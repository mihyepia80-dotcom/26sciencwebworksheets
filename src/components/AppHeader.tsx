"use client";

import Link from "next/link";
import { signOutUser } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { isGuest, isLoggedInStudent } from "@/lib/auth/access";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, role, studentProfile } = useAuth();
  const isStudent = isLoggedInStudent(user, role);
  const guestMode = isGuest(user, role);

  const handleLogout = async () => {
    await signOutUser();
    window.location.href = "/login";
  };

  return (
    <header className="border-b border-white/60 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-7 sm:px-8">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-lg text-slate-600">{subtitle}</p>}
          {role === "student" && studentProfile && (
            <p className="mt-2 text-base text-slate-500">
              {studentProfile.grade}학년 {studentProfile.classNo}반 · {studentProfile.studentNo}번{" "}
              {studentProfile.studentName}
            </p>
          )}
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {isStudent && (
            <>
              <Link href="/workspace" className="ui-btn-accent ui-btn-sm">
                탐구 활동실
              </Link>
              <Link href="/my" className="ui-btn-secondary ui-btn-sm">
                내 활동지
              </Link>
            </>
          )}
          {guestMode && (
            <>
              <Link href="/workspace" className="ui-btn-accent ui-btn-sm">
                탐구 활동실
              </Link>
              <Link href="/login" className="ui-btn-primary ui-btn-sm">
                로그인
              </Link>
            </>
          )}
          {role === "teacher" && (
            <Link href="/teacher" className="ui-btn-secondary ui-btn-sm">
              교사 대시보드
            </Link>
          )}
          {user && (
            <button type="button" onClick={handleLogout} className="ui-btn-ghost ui-btn-sm">
              로그아웃
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
