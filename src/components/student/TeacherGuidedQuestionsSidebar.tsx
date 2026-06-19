"use client";

import type { WorksheetMeta } from "@/lib/types";
import { GUIDED_QUESTION_SLOTS } from "@/lib/guided-questions/types";

interface TeacherGuidedQuestionsSidebarProps {
  meta: WorksheetMeta;
  questions: string[];
  loading: boolean;
  error: string;
  hasTeacherGuide: boolean;
}

export function TeacherGuidedQuestionsSidebar({
  meta,
  questions,
  loading,
  error,
  hasTeacherGuide,
}: TeacherGuidedQuestionsSidebarProps) {
  const filled = questions.filter((q) => q.trim());

  return (
    <aside className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
      <h2 className="text-sm font-bold text-emerald-900">선생님 가이드</h2>
      <p className="mt-1 text-xs text-emerald-800">
        왼쪽 학습지를 작성할 때 아래 질문과 수업 설정을 참고하세요.
      </p>

      {(meta.unit?.trim() || meta.topic?.trim() || meta.writingContext?.trim()) && (
        <dl className="mt-3 space-y-2 rounded-lg border border-emerald-100 bg-white/70 p-3 text-xs">
          {meta.unit?.trim() && (
            <div>
              <dt className="font-semibold text-emerald-800">단원</dt>
              <dd className="mt-0.5 text-slate-700">{meta.unit}</dd>
            </div>
          )}
          {meta.topic?.trim() && (
            <div>
              <dt className="font-semibold text-emerald-800">주제</dt>
              <dd className="mt-0.5 text-slate-700">{meta.topic}</dd>
            </div>
          )}
          {meta.writingContext?.trim() && (
            <div>
              <dt className="font-semibold text-emerald-800">글쓰기 상황</dt>
              <dd className="mt-0.5 text-slate-700">{meta.writingContext}</dd>
            </div>
          )}
        </dl>
      )}

      {loading && (
        <p className="mt-3 text-xs text-emerald-700">선생님이 준비한 내용을 불러오고 있어요…</p>
      )}
      {error && <p className="mt-3 text-xs text-amber-700">{error}</p>}

      {!loading && !hasTeacherGuide && !error && (
        <p className="mt-3 text-xs text-slate-500">
          아직 이 활동지에 고정된 유도 질문이 없습니다. 주제에 맞게 스스로 작성해 보세요.
        </p>
      )}

      {filled.length > 0 && (
        <ol className="mt-3 space-y-2">
          {Array.from({ length: GUIDED_QUESTION_SLOTS }, (_, i) => {
            const q = questions[i]?.trim();
            if (!q) return null;
            return (
              <li
                key={i}
                className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <span className="mr-1.5 text-xs font-bold text-emerald-700">Q{i + 1}</span>
                {q}
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
