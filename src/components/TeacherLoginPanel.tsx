"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getFirebaseErrorMessage, isTeacherGoogleRedirectInProgress, signInTeacherWithGoogle } from "@/lib/firebase";

interface TeacherLoginPanelProps {
  onSuccess?: () => void;
}

export function TeacherLoginPanel({ onSuccess }: TeacherLoginPanelProps) {
  const { user, role, confirmTeacherPin } = useAuth();
  const [teacherPassword, setTeacherPassword] = useState("");
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);

  useEffect(() => {
    if (!pinVerified || role !== "teacher") return;
    setPinVerified(false);
    onSuccess?.();
  }, [pinVerified, role, onSuccess]);

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInTeacherWithGoogle();
    } catch (err: unknown) {
      if (isTeacherGoogleRedirectInProgress(err)) {
        setError("Google 로그인 페이지로 이동합니다…");
        return;
      }
      setError(getFirebaseErrorMessage(err, "Google 로그인에 실패했습니다."));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePinSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setPinLoading(true);
    try {
      const ok = await confirmTeacherPin(teacherPassword);
      if (!ok) {
        setError("암호가 올바르지 않습니다.");
        return;
      }
      setTeacherPassword("");
      setPinVerified(true);
    } finally {
      setPinLoading(false);
    }
  };

  const needsTeacherPin = Boolean(user && role !== "student" && role !== "teacher");

  if (needsTeacherPin) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">{user?.email}</p>
        <form onSubmit={handlePinSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            placeholder="교사 암호"
            value={teacherPassword}
            onChange={(e) => setTeacherPassword(e.target.value)}
            required
            autoFocus
          />
          <button
            type="submit"
            disabled={pinLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {pinLoading ? "확인 중..." : "교사로 시작하기"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <button
        type="button"
        disabled={googleLoading}
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {googleLoading ? "연결 중..." : "Google로 로그인"}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
