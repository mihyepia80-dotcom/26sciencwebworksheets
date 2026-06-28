"use client";

import { useState } from "react";
import { getFirebaseErrorMessage, signInTeacher } from "@/lib/firebase";

interface TeacherLoginPanelProps {
  onSuccess?: () => void;
  consentComplete?: boolean;
  onBeforeLogin?: () => void;
}

export function TeacherLoginPanel({ onSuccess, consentComplete = true, onBeforeLogin }: TeacherLoginPanelProps) {
  const [teacherPassword, setTeacherPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTeacherLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!consentComplete) {
      setError("서비스 이용 동의를 모두 확인해 주세요.");
      return;
    }
    setLoading(true);

    try {
      onBeforeLogin?.();
      await signInTeacher(teacherPassword);
      setTeacherPassword("");
      onSuccess?.();
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err, "교사 로그인에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleTeacherLogin} className="ui-card space-y-4 p-6">
      <h2 className="text-lg font-bold text-slate-800">교사 로그인</h2>
      <p className="text-sm leading-relaxed text-slate-600">
        교사 암호로 로그인하면 제출된 활동지·지도안·유도 질문을 관리할 수 있습니다.
      </p>
      <input
        type="password"
        className="ui-input"
        placeholder="교사 암호"
        value={teacherPassword}
        onChange={(e) => setTeacherPassword(e.target.value)}
        required
        disabled={!consentComplete}
      />
      <button type="submit" disabled={loading || !consentComplete} className="ui-btn-primary w-full">
        {loading ? "로그인 중..." : "교사로 시작하기"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
