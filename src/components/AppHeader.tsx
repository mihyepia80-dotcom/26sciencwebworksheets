"use client";

import Link from "next/link";
import { signOutUser } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user, role, studentProfile } = useAuth();

  const handleLogout = async () => {
    await signOutUser();
    window.location.href = "/login";
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
          {role === "student" && studentProfile && (
            <p className="mt-1 text-sm text-slate-500">
              {studentProfile.grade}학년 {studentProfile.classNo}반 · {studentProfile.studentNo}번{" "}
              {studentProfile.studentName}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {role === "student" && (
            <Link
              href="/workspace"
              className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 hover:bg-violet-100"
            >
              탐구 활동실
            </Link>
          )}
          {role === "student" && (
            <Link
              href="/my"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-700"
            >
              내 활동지
            </Link>
          )}
          {role === "teacher" && (
            <Link
              href="/teacher"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-blue-300 hover:text-blue-700"
            >
              교사 대시보드
            </Link>
          )}
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              로그아웃
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
