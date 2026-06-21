"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeacherLoginPanel } from "@/components/TeacherLoginPanel";
import { isFirebaseConfigured, signInStudent, getFirebaseErrorMessage } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [grade, setGrade] = useState("");
  const [classNo, setClassNo] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  if (!isFirebaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">Firebase 설정 필요</h1>
        <p className="mt-3 text-base text-slate-600">`.env` 파일에 Firebase 환경 변수를 입력하세요.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">사고도구 톡톡</h1>
        <p className="mt-2 text-base text-slate-600">학생 로그인 후 사고도구 학습지를 작성하세요</p>
      </div>

      <form onSubmit={handleStudentLogin} className="ui-card mt-10 space-y-4 p-6">
        <h2 className="text-lg font-bold text-slate-800">학생 로그인</h2>
        <div className="grid grid-cols-3 gap-3">
          <input className="ui-input" placeholder="학년" value={grade} onChange={(e) => setGrade(e.target.value)} required />
          <input className="ui-input" placeholder="반" value={classNo} onChange={(e) => setClassNo(e.target.value)} required />
          <input className="ui-input" placeholder="번호" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} required />
        </div>
        <input className="ui-input" placeholder="이름" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
        <input
          type="password"
          className="ui-input"
          placeholder="암호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className="ui-btn-primary w-full">
          {loading ? "로그인 중..." : "학생으로 시작하기"}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-slate-800">교사 로그인</h2>
        <TeacherLoginPanel onSuccess={() => router.replace("/teacher")} />
      </div>

      {error && <p className="mt-6 text-center text-base text-red-600">{error}</p>}
    </div>
  );
}
