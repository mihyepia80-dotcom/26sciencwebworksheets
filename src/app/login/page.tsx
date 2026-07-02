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
import { ACCESS_PIN_HINT, ACCESS_PIN_LENGTH } from "@/lib/constants";
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
      <div className="page-main-narrow py-20 text-center">
        <h1 className="ui-page-title">Firebase 설정 필요</h1>
        <p className="ui-page-desc">`.env` 파일에 Firebase 환경 변수를 입력하세요.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12 sm:px-8">
      <header className="ui-panel-soft text-center">
        <p className="text-base font-semibold text-violet-600">사고도구 톡톡</p>
        <h1 className="ui-page-title mt-2">로그인</h1>
        <p className="ui-page-desc text-slate-700">
          로그인 없이 체험하거나, 로그인 후 활동지를 저장·제출하세요.
        </p>
      </header>

      <div className="mt-8">
        <ServiceConsentPanel value={consent} onChange={setConsent} />
      </div>

      <form onSubmit={handleStudentLogin} className="ui-panel mt-8 space-y-5">
        <h2 className="ui-section-title text-2xl">로그인</h2>
        <p className="text-base text-slate-600">
          담임 선생님이 명단에 등록한 학생만 로그인할 수 있습니다. 암호는 선생님이 알려주신 6자리 숫자입니다.
        </p>
        <p className="rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-900">{ACCESS_PIN_HINT}</p>
        <div className="grid grid-cols-3 gap-3">
          <input className="ui-input" placeholder="학년" value={grade} onChange={(e) => setGrade(e.target.value)} required disabled={!consentComplete} />
          <input className="ui-input" placeholder="반" value={classNo} onChange={(e) => setClassNo(e.target.value)} required disabled={!consentComplete} />
          <input className="ui-input" placeholder="번호" value={studentNo} onChange={(e) => setStudentNo(e.target.value)} required disabled={!consentComplete} />
        </div>
        <input className="ui-input" placeholder="이름" value={studentName} onChange={(e) => setStudentName(e.target.value)} required disabled={!consentComplete} />
        <input
          type="password"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={ACCESS_PIN_LENGTH}
          className="ui-input text-center tracking-[0.35em]"
          placeholder="6자리 숫자 암호"
          value={password}
          onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, ACCESS_PIN_LENGTH))}
          required
          disabled={!consentComplete}
        />
        <button type="submit" disabled={loading || !consentComplete} className="ui-btn-primary w-full">
          {loading ? "로그인 중..." : "학생으로 시작하기"}
        </button>
      </form>

      <div className="mt-8">
        <TeacherLoginPanel
          consentComplete={consentComplete}
          onBeforeLogin={persistConsent}
          onSuccess={() => router.replace("/teacher")}
        />
      </div>

      {error && <p className="ui-message-error mt-6">{error}</p>}

      <SiteLegalFooter className="mt-10 pb-6" />
    </div>
  );
}
