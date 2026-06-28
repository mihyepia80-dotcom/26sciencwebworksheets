"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeacherLoginPanel } from "@/components/TeacherLoginPanel";
import { ServiceConsentPanel } from "@/components/legal/ServiceConsentPanel";
import { SiteLegalFooter } from "@/components/legal/SiteLegalFooter";
import {
  EMPTY_CONSENT,
  isConsentFormComplete,
  saveServiceConsent,
} from "@/lib/legal/consent";
import { isFirebaseConfigured, signInStudent, getFirebaseErrorMessage } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [grade, setGrade] = useState("");
  const [classNo, setClassNo] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(EMPTY_CONSENT);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const consentComplete = isConsentFormComplete(consent);

  const persistConsent = () => {
    if (consentComplete) {
      saveServiceConsent(consent);
    }
  };

  const handleStudentLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!consentComplete) {
      setError("서비스 이용 동의를 모두 확인해 주세요.");
      return;
    }
    setLoading(true);

    try {
      persistConsent();
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">사고도구 톡톡</h1>
        <p className="mt-2 text-base text-slate-600">로그인 없이 체험하거나, 학생 로그인 후 활동지를 저장·제출하세요</p>
      </div>

      <div className="mt-8">
        <ServiceConsentPanel value={consent} onChange={setConsent} />
      </div>

      <form onSubmit={handleStudentLogin} className="ui-card mt-6 space-y-4 p-6">
        <h2 className="text-lg font-bold text-slate-800">학생 로그인</h2>
        <div className="grid grid-cols-3 gap-3">
          <input className="ui-input" placeholder="학년" value={grade} onChange={(e) => setGrade(e.target.value)} required disabled={!consentComplete} />
          <input className="ui-input" placeholder="반" value={classNo} onChange={(e) => setClassNo(e.target.value)} required disabled={!consentComplete} />
          <input className="ui-input" placeholder="번호" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} required disabled={!consentComplete} />
        </div>
        <input className="ui-input" placeholder="이름" value={studentName} onChange={(e) => setStudentName(e.target.value)} required disabled={!consentComplete} />
        <input
          type="password"
          className="ui-input"
          placeholder="암호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={!consentComplete}
        />
        <button type="submit" disabled={loading || !consentComplete} className="ui-btn-primary w-full">
          {loading ? "로그인 중..." : "학생으로 시작하기"}
        </button>
      </form>

      <div className="mt-6">
        <TeacherLoginPanel
          consentComplete={consentComplete}
          onBeforeLogin={persistConsent}
          onSuccess={() => router.replace("/teacher")}
        />
      </div>

      {error && <p className="mt-6 text-center text-base text-red-600">{error}</p>}

      <SiteLegalFooter className="mt-10 pb-6" />
    </div>
  );
}
