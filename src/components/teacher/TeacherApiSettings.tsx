"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { TeacherLoginPanel } from "@/components/TeacherLoginPanel";
import { fetchTeacherApiStatus, saveTeacherApiConfig } from "@/lib/teacher/api-config-client";
import type { TeacherApiStatus } from "@/lib/teacher/api-config";

const INPUT = "ui-input-compact w-full font-mono text-sm";

function StatusBadge({ configured, source }: { configured: boolean; source: string }) {
  if (!configured) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
        미설정
      </span>
    );
  }
  if (source === "platform") {
    return (
      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-900">
        플랫폼 공용 키
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
      내 API 키 연결됨
    </span>
  );
}

export function TeacherApiSettings() {
  const { user, role, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<TeacherApiStatus | null>(null);
  const [geminiInput, setGeminiInput] = useState("");
  const [padletInput, setPadletInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user || role !== "teacher") return;
    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const next = await fetchTeacherApiStatus(token);
      setStatus(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "API 상태를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveGemini = async () => {
    if (!user || !status || status.isPlatformAdmin) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = await user.getIdToken();
      const next = await saveTeacherApiConfig(token, { geminiApiKey: geminiInput.trim() || null });
      setStatus(next);
      setGeminiInput("");
      setMessage("Gemini API 키를 저장했습니다.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePadlet = async () => {
    if (!user || !status || status.isPlatformAdmin) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = await user.getIdToken();
      const next = await saveTeacherApiConfig(token, { padletApiKey: padletInput.trim() || null });
      setStatus(next);
      setPadletInput("");
      setMessage("Padlet API 키를 저장했습니다.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleClearGemini = async () => {
    if (!user || !status || status.isPlatformAdmin) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = await user.getIdToken();
      const next = await saveTeacherApiConfig(token, { geminiApiKey: null });
      setStatus(next);
      setGeminiInput("");
      setMessage("Gemini API 키를 삭제했습니다.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleClearPadlet = async () => {
    if (!user || !status || status.isPlatformAdmin) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const token = await user.getIdToken();
      const next = await saveTeacherApiConfig(token, { padletApiKey: null });
      setStatus(next);
      setPadletInput("");
      setMessage("Padlet API 키를 삭제했습니다.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <p className="text-sm text-slate-500">확인 중...</p>;
  }

  if (!user || role !== "teacher") {
    return <TeacherLoginPanel />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <Link href="/teacher" className="ui-link text-sm">
          ← 교사 대시보드
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">API 연동 설정</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Google 로그인 교사는 <strong>본인 API 키</strong>로 AI·Padlet 기능을 사용합니다. Vercel에 설정된
          공용 키는 <strong>플랫폼 관리자만</strong> 사용할 수 있습니다.
        </p>
      </div>

      {status?.isPlatformAdmin && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 px-5 py-4 text-sm text-indigo-950">
          <p className="font-semibold">플랫폼 관리자 계정</p>
          <p className="mt-1 leading-relaxed">
            이 계정은 서버에 등록된 공용 Gemini·Padlet API 키를 사용합니다. 다른 교사 계정과 달리
            개인 키 등록이 필요하지 않습니다.
          </p>
        </div>
      )}

      {!status?.isPlatformAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">다른 Google 교사 계정 안내</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>관리자 공용 API 키는 사용할 수 없습니다.</li>
            <li>아래에서 본인 Google AI Studio·Padlet Developer API 키를 등록해야 AI·패들렛 기능이 동작합니다.</li>
            <li>키는 서버에만 저장되며, 학생 화면에는 노출되지 않습니다.</li>
          </ul>
        </div>
      )}

      {loading && <p className="text-sm text-slate-500">연동 상태 확인 중…</p>}

      {status && (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Gemini API (AI)</h2>
              <StatusBadge configured={status.gemini.configured} source={status.gemini.source} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              유도 질문·지도안·학습지 AI, 학생 피드백, 탐구질문 챗봇 「막혔어요」에 사용됩니다.
            </p>
            {!status.isPlatformAdmin && (
              <>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                  <li>
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-violet-700 underline-offset-2 hover:underline"
                    >
                      Google AI Studio
                    </a>
                    에서 API 키를 발급합니다.
                  </li>
                  <li>아래에 키를 붙여넣고 저장합니다. (기존 키는 화면에 다시 표시되지 않습니다.)</li>
                </ol>
                <label className="mt-4 block">
                  <span className="ui-label text-sm">Gemini API 키</span>
                  <input
                    type="password"
                    className={INPUT}
                    value={geminiInput}
                    placeholder="AIza…"
                    autoComplete="off"
                    onChange={(e) => setGeminiInput(e.target.value)}
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="ui-btn-primary ui-btn-sm" disabled={saving || !geminiInput.trim()} onClick={handleSaveGemini}>
                    Gemini 키 저장
                  </button>
                  {status.gemini.source === "teacher" && (
                    <button type="button" className="ui-btn-secondary ui-btn-sm" disabled={saving} onClick={handleClearGemini}>
                      키 삭제
                    </button>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Padlet API</h2>
              <StatusBadge configured={status.padlet.configured} source={status.padlet.source} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              차시별 나눔 게시판 생성·학생 활동지 Padlet 게시에 사용됩니다.
            </p>
            {!status.isPlatformAdmin && (
              <>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                  <li>
                    <a
                      href="https://padlet.com/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-violet-700 underline-offset-2 hover:underline"
                    >
                      Padlet Developer
                    </a>
                    에서 API 키를 발급합니다. (유료 계정 필요)
                  </li>
                  <li>아래에 키를 붙여넣고 저장합니다.</li>
                </ol>
                <label className="mt-4 block">
                  <span className="ui-label text-sm">Padlet API 키</span>
                  <input
                    type="password"
                    className={INPUT}
                    value={padletInput}
                    placeholder="padlet_…"
                    autoComplete="off"
                    onChange={(e) => setPadletInput(e.target.value)}
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="ui-btn-primary ui-btn-sm" disabled={saving || !padletInput.trim()} onClick={handleSavePadlet}>
                    Padlet 키 저장
                  </button>
                  {status.padlet.source === "teacher" && (
                    <button type="button" className="ui-btn-secondary ui-btn-sm" disabled={saving} onClick={handleClearPadlet}>
                      키 삭제
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && status && !status.isPlatformAdmin && (!status.gemini.configured || !status.padlet.configured) && (
        <p className="text-sm text-amber-800">
          {!status.gemini.configured && !status.padlet.configured
            ? "AI·Padlet 기능을 쓰려면 위 두 API 키를 모두 등록해 주세요."
            : !status.gemini.configured
              ? "AI 기능을 쓰려면 Gemini API 키를 등록해 주세요."
              : "Padlet 게시판·게시 기능을 쓰려면 Padlet API 키를 등록해 주세요."}
        </p>
      )}
    </div>
  );
}
