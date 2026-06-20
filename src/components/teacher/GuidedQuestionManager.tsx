"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { requestGuidedQuestions } from "@/lib/ai/guided-questions";
import {
  createGuidedQuestionSet,
  deleteGuidedQuestionSet,
  getFirebaseErrorMessage,
  listTeacherGuidedQuestionSets,
  updateGuidedQuestionSet,
} from "@/lib/firebase";
import { getSortedTemplates } from "@/lib/templates/registry";
import { getMetaFieldLabel, getMetaFieldPlaceholder } from "@/lib/meta-labels";
import { GUIDED_QUESTION_SLOTS } from "@/lib/guided-questions/types";
import type { GuidedQuestionSet } from "@/lib/guided-questions/types";

const INPUT = "w-full rounded border border-slate-200 px-3 py-2 text-sm";

function emptySlots(questions: string[] = []): string[] {
  const next = [...questions];
  while (next.length < GUIDED_QUESTION_SLOTS) next.push("");
  return next.slice(0, GUIDED_QUESTION_SLOTS);
}

export function GuidedQuestionManager() {
  const { user, role } = useAuth();
  const templates = getSortedTemplates();
  const [sets, setSets] = useState<GuidedQuestionSet[]>([]);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [unit, setUnit] = useState("");
  const [grade, setGrade] = useState("");
  const [writingContext, setWritingContext] = useState("");
  const [questions, setQuestions] = useState<string[]>(emptySlots());
  const [pinned, setPinned] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const template = templates.find((t) => t.id === templateId);

  const loadList = useCallback(() => {
    if (!user || role !== "teacher") return;
    setLoading(true);
    listTeacherGuidedQuestionSets(user.uid)
      .then(setSets)
      .catch((e: unknown) => setError(getFirebaseErrorMessage(e, "목록 불러오기 실패")))
      .finally(() => setLoading(false));
  }, [user, role]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleGenerate = async () => {
    if (!template || !topic.trim()) {
      setError("템플릿과 활동 주제를 입력하세요.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const result = await requestGuidedQuestions({
        templateId: template.id,
        templateName: template.name,
        meta: { topic, unit, grade, writingContext },
      });
      setQuestions(emptySlots(result.questions));
      setMessage("AI가 초등 수준의 유도 질문을 만들었습니다. 수정 후 고정할 수 있습니다.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI 생성 실패");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !template || !topic.trim()) {
      setError("템플릿과 활동 주제를 입력하세요.");
      return;
    }
    const cleaned = questions.map((q) => q.trim()).filter(Boolean);
    if (cleaned.length < 3) {
      setError("질문을 3개 이상 입력하세요.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      teacherUid: user.uid,
      templateId: template.id,
      templateName: template.name,
      topic: topic.trim(),
      unit: unit.trim() || undefined,
      grade: grade.trim() || undefined,
      writingContext: writingContext.trim() || undefined,
      questions: cleaned,
      pinned,
    };

    try {
      if (editingId) {
        await updateGuidedQuestionSet(editingId, payload);
        setMessage(pinned ? "고정 질문을 저장했습니다." : "질문 세트를 저장했습니다.");
      } else {
        await createGuidedQuestionSet(payload);
        setMessage(pinned ? "학생에게 고정 질문으로 제공됩니다." : "질문 세트를 저장했습니다.");
      }
      loadList();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "저장 실패"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (set: GuidedQuestionSet) => {
    setEditingId(set.id ?? null);
    setTemplateId(set.templateId);
    setTopic(set.topic);
    setUnit(set.unit ?? "");
    setGrade(set.grade ?? "");
    setWritingContext(set.writingContext ?? "");
    setQuestions(emptySlots(set.questions));
    setPinned(set.pinned);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("이 유도 질문 세트를 삭제할까요?")) return;
    try {
      await deleteGuidedQuestionSet(id);
      if (editingId === id) setEditingId(null);
      loadList();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "삭제 실패"));
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setTopic("");
    setUnit("");
    setGrade("");
    setWritingContext("");
    setQuestions(emptySlots());
    setPinned(true);
    setMessage("");
    setError("");
  };

  if (role !== "teacher" || !user) {
    return (
      <p className="text-sm text-slate-600">
        <Link href="/login" className="text-blue-600 hover:underline">
          교사 로그인
        </Link>
        후 이용할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/teacher" className="text-sm text-blue-600 hover:underline">
            ← 교사 대시보드
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">유도 질문 관리</h1>
          <p className="mt-1 text-sm text-slate-600">
            단원·주제·{getMetaFieldLabel("writingContext")}과 가이드 질문을 저장하면 학생 활동지에 반영됩니다. AI 질문 생성은 교사만 사용합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          새로 만들기
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">{editingId ? "질문 세트 수정" : "새 유도 질문"}</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-600">사고도구(템플릿)</span>
            <select className={INPUT} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">활동 주제 *</span>
            <input className={INPUT} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="예: 물의 증발" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">학년</span>
            <input className={INPUT} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="예: 5학년" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-600">단원</span>
            <input className={INPUT} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="예: 2단원 물의 상태 변화" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-600">{getMetaFieldLabel("writingContext")}</span>
            <textarea
              className={`${INPUT} min-h-[72px] resize-y`}
              value={writingContext}
              onChange={(e) => setWritingContext(e.target.value)}
              placeholder={getMetaFieldPlaceholder("writingContext")}
              rows={2}
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {questions.map((q, i) => (
            <label key={i} className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">질문 {i + 1}</span>
              <textarea
                className={`${INPUT} min-h-[64px] resize-y`}
                value={q}
                onChange={(e) => {
                  const next = [...questions];
                  next[i] = e.target.value;
                  setQuestions(next);
                }}
                rows={2}
              />
            </label>
          ))}
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          학생에게 제공 — 고정 시 해당 템플릿 활동지에 단원·주제·{getMetaFieldLabel("writingContext")}·가이드 질문이 반영됩니다
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-60"
          >
            {generating ? "AI 생성 중…" : "AI로 질문 만들기"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>

        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-800">저장된 질문 세트</h2>
        {loading && <p className="mt-3 text-sm text-slate-500">불러오는 중…</p>}
        {!loading && sets.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">저장된 질문이 없습니다.</p>
        )}
        <ul className="mt-4 space-y-3">
          {sets.map((set) => (
            <li key={set.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800">
                    {set.templateName} · {set.topic}
                    {set.pinned && (
                      <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">고정</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {set.grade || "학년 미지정"} · {set.unit || "단원 미지정"}
                    {set.writingContext ? ` · ${set.writingContext}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => handleEdit(set)}>
                    수정
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => set.id && handleDelete(set.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                {set.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
