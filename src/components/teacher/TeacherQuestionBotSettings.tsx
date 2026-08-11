"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { getClientDb, getFirebaseErrorMessage } from "@/lib/firebase";
import { QB_TURN_LIMIT_PER_PERIOD } from "@/lib/inquiry-question-bot/config";

const INPUT = "ui-input-compact w-full";
const TEXTAREA = "ui-textarea w-full";

interface QuestionBotConfigForm {
  enabled: boolean;
  turnLimit: number;
  unitHint: string;
}

export function TeacherQuestionBotSettings() {
  const { user, role } = useAuth();
  const [form, setForm] = useState<QuestionBotConfigForm>({
    enabled: true,
    turnLimit: QB_TURN_LIMIT_PER_PERIOD,
    unitHint: "용해와 용액 단원 — 물질이 물에 녹는 현상, 온도·양·시간을 바꿔 볼 수 있어요.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user || role !== "teacher") return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(getClientDb(), "teachers", user.uid));
      const cfg = snap.data()?.questionBotConfig as
        | { enabled?: boolean; turnLimit?: number; unitHints?: Record<string, string> }
        | undefined;
      if (cfg) {
        setForm({
          enabled: cfg.enabled !== false,
          turnLimit: Number(cfg.turnLimit) > 0 ? Number(cfg.turnLimit) : QB_TURN_LIMIT_PER_PERIOD,
          unitHint:
            cfg.unitHints?.["dissolution-solution"] ??
            "용해와 용액 단원 — 물질이 물에 녹는 현상, 온도·양·시간을 바꿔 볼 수 있어요.",
        });
      }
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "설정 불러오기 실패"));
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!user || role !== "teacher") return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await setDoc(
        doc(getClientDb(), "teachers", user.uid),
        {
          questionBotConfig: {
            enabled: form.enabled,
            turnLimit: Math.min(10, Math.max(1, form.turnLimit)),
            unitHints: { "dissolution-solution": form.unitHint.trim() },
          },
        },
        { merge: true },
      );
      setMessage("탐구질문 챗봇 설정을 저장했습니다.");
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "저장 실패"));
    } finally {
      setSaving(false);
    }
  };

  if (role !== "teacher") {
    return <p className="py-20 text-center text-sm text-slate-500">교사 로그인이 필요합니다.</p>;
  }

  return (
    <div className="page-main-narrow">
      <Link href="/teacher" className="text-sm text-violet-700 hover:underline">
        ← 교사 대시보드
      </Link>
      <h1 className="ui-page-title mt-4">탐구질문 챗봇 설정</h1>
      <p className="ui-page-desc">
        학생 학습지의 「탐구 질문 만들기」 도우미를 켜거나 끄고, 차시당 도움 횟수·단원 힌트를 설정합니다.
      </p>

      {loading ? (
        <p className="mt-6 text-slate-500">불러오는 중…</p>
      ) : (
        <div className="ui-card mt-6 space-y-5 p-6">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            />
            학생 화면에 탐구질문 챗봇 사용 (AI 도움받기)
          </label>

          <div>
            <label className="ui-label" htmlFor="qb-turn-limit">
              차시당 「막혔어요」 횟수 상한
            </label>
            <input
              id="qb-turn-limit"
              type="number"
              min={1}
              max={10}
              className={INPUT}
              value={form.turnLimit}
              onChange={(e) =>
                setForm((f) => ({ ...f, turnLimit: Number(e.target.value) || QB_TURN_LIMIT_PER_PERIOD }))
              }
            />
            <p className="mt-1 text-xs text-slate-500">1일 전체 상한은 서버 환경 변수(기본 5회)로 적용됩니다.</p>
          </div>

          <div>
            <label className="ui-label" htmlFor="qb-unit-hint">
              단원 힌트 (AI 프롬프트용, 학생 화면 미노출)
            </label>
            <textarea
              id="qb-unit-hint"
              rows={3}
              className={TEXTAREA}
              value={form.unitHint}
              onChange={(e) => setForm((f) => ({ ...f, unitHint: e.target.value }))}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}

          <div className="flex flex-wrap gap-3">
            <button type="button" className="ui-btn-primary ui-btn-sm" disabled={saving} onClick={handleSave}>
              {saving ? "저장 중…" : "설정 저장"}
            </button>
            <Link href="/teacher/question-bot/logs" className="ui-btn-secondary ui-btn-sm">
              질문 정교화 로그 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
