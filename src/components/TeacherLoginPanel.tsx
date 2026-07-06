"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ACCESS_PIN_HINT, ACCESS_PIN_LENGTH, isValidAccessPin, normalizeAccessPin } from "@/lib/constants";
import {
  completeTeacherGoogleRedirect,
  getFirebaseErrorMessage,
  getTeacherProfile,
  isTeacherGoogleRedirectInProgress,
  resetTeacherAccessPin,
  setupTeacherAccessPin,
  signInTeacherWithGoogle,
} from "@/lib/firebase";

interface TeacherLoginPanelProps {
  onSuccess?: () => void;
  consentComplete?: boolean;
  onBeforeLogin?: () => void;
}

type TeacherAuthStep = "google" | "setup-pin" | "verify-pin";

export function TeacherLoginPanel({ onSuccess, consentComplete = true, onBeforeLogin }: TeacherLoginPanelProps) {
  const { user, role, confirmTeacherPin } = useAuth();
  const [step, setStep] = useState<TeacherAuthStep>("google");
  const [accessPin, setAccessPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [redirectPending, setRedirectPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setRedirectPending(true);
    completeTeacherGoogleRedirect()
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getFirebaseErrorMessage(err, "Google 로그인에 실패했습니다."));
        }
      })
      .finally(() => {
        if (!cancelled) setRedirectPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || role === "student") {
      setStep("google");
      return;
    }

    setTeacherEmail(user.email ?? "");

    if (role === "teacher") {
      onSuccess?.();
      return;
    }

    setStep("setup-pin");

    let cancelled = false;
    getTeacherProfile(user.uid)
      .then((profile) => {
        if (cancelled) return;
        if (profile?.accessPin && !resetMode) {
          setStep("verify-pin");
        } else {
          setStep("setup-pin");
        }
      })
      .catch(() => {
        if (!cancelled) setStep("setup-pin");
      });

    return () => {
      cancelled = true;
    };
  }, [user, role, resetMode, onSuccess]);

  const handleGoogleLogin = async () => {
    setError("");
    if (!consentComplete) {
      setError("서비스 이용 동의를 모두 확인해 주세요.");
      return;
    }

    setGoogleLoading(true);
    try {
      onBeforeLogin?.();
      await signInTeacherWithGoogle();
    } catch (err: unknown) {
      if (isTeacherGoogleRedirectInProgress(err)) {
        setRedirectPending(true);
        setError("Google 로그인 페이지로 이동합니다…");
        return;
      }
      setError(getFirebaseErrorMessage(err, "Google 로그인에 실패했습니다."));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSetupPin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setError("");
    setSubmitLoading(true);
    try {
      const pin = accessPin;
      if (resetMode) {
        await resetTeacherAccessPin(user, pin, confirmPin);
      } else {
        await setupTeacherAccessPin(user, pin, confirmPin);
      }
      setAccessPin("");
      setConfirmPin("");
      setResetMode(false);
      await confirmTeacherPin(pin);
      onSuccess?.();
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err, "암호 설정에 실패했습니다."));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVerifyPin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSubmitLoading(true);
    try {
      const ok = await confirmTeacherPin(accessPin);
      if (!ok) {
        setError("암호가 올바르지 않습니다.");
        return;
      }
      setAccessPin("");
      onSuccess?.();
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePinInput = (value: string, setter: (next: string) => void) => {
    setter(value.replace(/\D/g, "").slice(0, ACCESS_PIN_LENGTH));
  };

  if (user && role !== "student" && step !== "google") {
    return (
      <div className="ui-panel space-y-5">
        <h2 className="ui-section-title text-2xl">{step === "setup-pin" ? "교사 암호 설정" : "교사 암호 입력"}</h2>
        <p className="text-base leading-relaxed text-slate-600">
          {teacherEmail && <span className="block font-medium text-slate-800">{teacherEmail}</span>}
          {step === "setup-pin"
            ? "학생 로그인에 사용할 6자리 숫자 암호를 설정하세요. 학생은 이 암호만 맞으면 로그인할 수 있습니다."
            : "대시보드에 들어가려면 설정한 6자리 숫자 암호를 입력하세요."}
        </p>
        <p className="rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-900">{ACCESS_PIN_HINT}</p>

        {step === "setup-pin" ? (
          <form onSubmit={handleSetupPin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={ACCESS_PIN_LENGTH}
              className="ui-input text-center tracking-[0.35em]"
              placeholder="6자리 숫자 암호"
              value={accessPin}
              onChange={(e) => handlePinInput(e.target.value, setAccessPin)}
              required
              autoFocus
            />
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={ACCESS_PIN_LENGTH}
              className="ui-input text-center tracking-[0.35em]"
              placeholder="암호 확인"
              value={confirmPin}
              onChange={(e) => handlePinInput(e.target.value, setConfirmPin)}
              required
            />
            <button type="submit" disabled={submitLoading || !isValidAccessPin(accessPin)} className="ui-btn-primary w-full">
              {submitLoading ? "저장 중..." : resetMode ? "새 암호로 저장" : "암호 설정하고 시작하기"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyPin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={ACCESS_PIN_LENGTH}
              className="ui-input text-center tracking-[0.35em]"
              placeholder="6자리 숫자 암호"
              value={accessPin}
              onChange={(e) => handlePinInput(e.target.value, setAccessPin)}
              required
              autoFocus
            />
            <button type="submit" disabled={submitLoading || !isValidAccessPin(accessPin)} className="ui-btn-primary w-full">
              {submitLoading ? "확인 중..." : "교사 대시보드 들어가기"}
            </button>
            <button
              type="button"
              className="w-full text-sm text-slate-600 underline-offset-2 hover:underline"
              onClick={() => {
                setResetMode(true);
                setStep("setup-pin");
                setAccessPin("");
                setConfirmPin("");
                setError("");
              }}
            >
              암호를 잊으셨나요?
            </button>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              암호 재설정: 위 Google 계정({teacherEmail || "등록 이메일"})으로 다시 로그인한 뒤 새 6자리 숫자 암호를
              설정하세요. Firebase Console 등 서비스 설정은 각 교사의 개인 Google 계정에서 확인합니다.
            </p>
          </form>
        )}

        {error && <p className="text-base text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="ui-panel space-y-5">
      <h2 className="ui-section-title text-2xl">교사 로그인</h2>
      <p className="text-base leading-relaxed text-slate-600">
        Google 계정으로 로그인한 뒤, 6자리 숫자 암호를 설정·입력하면 학생 활동을 관리할 수 있습니다.
      </p>
      <button
        type="button"
        disabled={googleLoading || redirectPending || !consentComplete}
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
      >
        {redirectPending ? "Google 로그인 확인 중..." : googleLoading ? "연결 중..." : "Google로 로그인"}
      </button>
      {error && <p className="text-base text-red-600">{error}</p>}
    </div>
  );
}
