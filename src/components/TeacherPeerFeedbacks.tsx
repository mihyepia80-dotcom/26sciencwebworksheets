"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deletePeerFeedback,
  getFirebaseErrorMessage,
  listAllPeerFeedbacks,
  type PeerFeedbackDoc,
} from "@/lib/firebase";

function formatDate(feedback: PeerFeedbackDoc): string {
  if (!feedback.createdAt) return "-";
  return feedback.createdAt.toDate().toLocaleString("ko-KR");
}

export function TeacherPeerFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<PeerFeedbackDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    listAllPeerFeedbacks()
      .then(setFeedbacks)
      .catch((e: unknown) => setError(getFirebaseErrorMessage(e, "동료 피드백 목록을 불러오지 못했습니다.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const grades = useMemo(
    () => [...new Set(feedbacks.map((f) => f.grade).filter(Boolean))].sort(),
    [feedbacks],
  );
  const classes = useMemo(
    () =>
      [...new Set(feedbacks.filter((f) => !gradeFilter || f.grade === gradeFilter).map((f) => f.classNo).filter(Boolean))].sort(),
    [feedbacks, gradeFilter],
  );

  const filtered = useMemo(
    () =>
      feedbacks.filter((f) => {
        if (gradeFilter && f.grade !== gradeFilter) return false;
        if (classFilter && f.classNo !== classFilter) return false;
        return true;
      }),
    [feedbacks, gradeFilter, classFilter],
  );

  const handleDelete = async (feedback: PeerFeedbackDoc) => {
    if (!feedback.id) return;
    if (!window.confirm("이 동료 피드백을 삭제할까요?")) return;
    setDeletingId(feedback.id);
    setError("");
    try {
      await deletePeerFeedback(feedback.id);
      setFeedbacks((prev) => prev.filter((f) => f.id !== feedback.id));
      if (expandedId === feedback.id) setExpandedId(null);
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "삭제에 실패했습니다."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-slate-800">동료 피드백</h2>
      <p className="mt-1 text-sm text-slate-500">학생들이 남긴 동료 피드백을 모아 볼 수 있습니다.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="text-sm text-slate-600">
          학년
          <select
            className="ml-2 rounded border border-slate-200 px-2 py-1"
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value);
              setClassFilter("");
            }}
          >
            <option value="">전체</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}학년
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          반
          <select
            className="ml-2 rounded border border-slate-200 px-2 py-1"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">전체</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}반
              </option>
            ))}
          </select>
        </label>
        <span className="self-center text-sm text-slate-500">총 {filtered.length}건</span>
      </div>

      {loading && <p className="mt-4 text-sm text-slate-500">불러오는 중...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          아직 동료 피드백이 없습니다.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {filtered.map((feedback) => {
          const open = expandedId === feedback.id;
          return (
            <article key={feedback.id} className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left hover:bg-emerald-50/40"
                onClick={() => setExpandedId(open ? null : feedback.id ?? null)}
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {feedback.authorName} → {feedback.targetName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {feedback.grade && feedback.classNo
                      ? `${feedback.grade}학년 ${feedback.classNo}반 · `
                      : ""}
                    {feedback.templateName}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-slate-500">
                  <p>{formatDate(feedback)}</p>
                  <p className="mt-1">{open ? "접기" : "펼치기"}</p>
                </div>
              </button>

              {open && (
                <div className="space-y-3 border-t border-slate-100 px-4 py-4 text-sm">
                  <FeedbackRow label="나와 다른 점" value={feedback.differentPoint} />
                  <FeedbackRow label="잘한 점" value={feedback.goodPoint} />
                  <FeedbackRow label="궁금한 점" value={feedback.curiousPoint} />
                  <div className="flex justify-end border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={deletingId === feedback.id}
                      onClick={() => void handleDelete(feedback)}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === feedback.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FeedbackRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-slate-800">{value}</p>
    </div>
  );
}
