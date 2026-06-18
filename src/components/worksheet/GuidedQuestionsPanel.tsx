"use client";

import type { GuidedQuestionSource } from "@/lib/guided-questions/types";
import { GUIDED_QUESTION_SLOTS } from "@/lib/guided-questions/types";

const SOURCE_LABELS: Record<GuidedQuestionSource, string> = {
  pinned: "교사 가이드 질문",
  ai: "AI 생성 질문",
  saved: "수정한 질문",
  manual: "직접 작성",
};

interface GuidedQuestionsPanelProps {
  topic: string;
  questions: string[];
  source: GuidedQuestionSource | null;
  loading: boolean;
  error: string;
  readOnly?: boolean;
  studentView?: boolean;
  onQuestionChange: (index: number, value: string) => void;
  onRegenerate?: () => void;
}

export function GuidedQuestionsPanel({
  topic,
  questions,
  source,
  loading,
  error,
  readOnly,
  studentView = false,
  onQuestionChange,
  onRegenerate,
}: GuidedQuestionsPanelProps) {
  const filled = questions.filter((q) => q.trim()).length;
  const showAllSlots = studentView;

  return (
    <section className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-emerald-900">
            {studentView ? "가이드 질문" : "활동 주제 유도 질문"}
          </h2>
          <p className="mt-0.5 text-xs text-emerald-800">
            {studentView
              ? topic.trim()
                ? `선생님이 준비한 질문을 참고하거나, 주제 「${topic}」에 맞게 직접 적어 보세요.`
                : "선생님이 준비한 질문을 참고하거나, 스스로 탐구 질문을 적어 보세요."
              : `주제 「${topic}」에 맞는 탐구 질문입니다. 필요하면 문장을 바꿔 쓰세요.`}
          </p>
        </div>
        {!studentView && source && source !== "manual" && (
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-emerald-800 shadow-sm">
            {SOURCE_LABELS[source]}
          </span>
        )}
        {studentView && source === "pinned" && (
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-emerald-800 shadow-sm">
            선생님 질문
          </span>
        )}
      </div>

      {loading && (
        <p className="mb-3 text-xs text-emerald-700">
          {studentView ? "선생님이 준비한 내용을 불러오고 있어요…" : "주제에 맞는 질문을 준비하고 있어요…"}
        </p>
      )}
      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      <div className="space-y-2">
        {Array.from({ length: GUIDED_QUESTION_SLOTS }, (_, i) => {
          const value = questions[i] ?? "";
          if (!showAllSlots && !value && i >= filled && !loading) return null;
          return (
            <label key={i} className="block">
              <span className="mb-1 block text-xs font-semibold text-emerald-800">질문 {i + 1}</span>
              <textarea
                className="w-full resize-y rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-slate-50"
                rows={2}
                value={value}
                disabled={readOnly}
                placeholder={loading ? "불러오는 중…" : "질문을 입력하세요"}
                onChange={(e) => onQuestionChange(i, e.target.value)}
              />
            </label>
          );
        })}
      </div>

      {!studentView && !readOnly && source !== "pinned" && onRegenerate && (
        <button
          type="button"
          className="mt-3 text-xs font-medium text-emerald-700 underline hover:text-emerald-900 disabled:opacity-50"
          onClick={onRegenerate}
          disabled={loading}
        >
          AI로 질문 다시 만들기
        </button>
      )}

      {studentView && source === "pinned" && (
        <p className="mt-3 text-xs text-emerald-700">
          선생님이 준비한 질문입니다. 내 생각에 맞게 바꿔 써도 됩니다.
        </p>
      )}
    </section>
  );
}
