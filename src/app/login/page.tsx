"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isFirebaseConfigured, signInStudent, signInTeacherWithGoogle, getFirebaseErrorMessage } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [grade, setGrade] = useState("");
  const [classNo, setClassNo] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleStudentLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInStudent({ grade, classNo, studentNo, studentName }, password);
      router.replace("/");
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err, "로그인에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      await signInTeacherWithGoogle();
      router.replace("/teacher");
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err, "Google 로그인에 실패했습니다."));
    } finally {
      setGoogleLoading(false);
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Firebase 설정 필요</h1>
        <p className="mt-3 text-sm text-slate-600">`.env` 파일에 Firebase 환경 변수를 입력하세요.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">사고도구 톡톡</h1>
        <p className="mt-2 text-sm text-slate-600">학생 또는 교사로 로그인하세요</p>
      </div>

      <form
        onSubmit={handleStudentLogin}
        className="mt-8 space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-bold text-slate-800">학생 로그인</h2>
        <div className="grid grid-cols-3 gap-2">
          <input
            className="rounded border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="학년"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          />
          <input
            className="rounded border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="반"
            value={classNo}
            onChange={(e) => setClassNo(e.target.value)}
            required
          />
          <input
            className="rounded border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="번호"
            value={studentNo}
            onChange={(e) => setStudentNo(e.target.value)}
            required
          />
        </div>
        <input
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="이름"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="암호 (2600)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "로그인 중..." : "학생으로 시작하기"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800">교사 로그인</h2>
        <p className="mt-1 text-xs text-slate-500">등록된 Google 계정으로 로그인합니다.</p>
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleLogin}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {googleLoading ? "연결 중..." : "Google로 로그인"}
        </button>
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
