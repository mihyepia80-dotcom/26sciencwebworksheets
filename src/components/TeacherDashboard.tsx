"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TeacherLoginPanel } from "@/components/TeacherLoginPanel";
import { TeacherDailyTable } from "@/components/TeacherDailyTable";
import { TeacherInquiryReports } from "@/components/TeacherInquiryReports";
import { TeacherPeerFeedbacks } from "@/components/TeacherPeerFeedbacks";
import { TeacherAwardBadgeQuick } from "@/components/teacher/TeacherAwardBadgeQuick";
import { AiFeedbackCard } from "@/components/AiFeedbackCard";
import { useAuth } from "@/components/AuthProvider";
import {
  deleteSubmission,
  getFirebaseErrorMessage,
  isFirebaseConfigured,
  listTeacherSubmissions,
  signOutUser,
} from "@/lib/firebase";
import { getMetaFieldLabel } from "@/lib/meta-labels";
import type { WorksheetSubmission } from "@/lib/firebase/submissions";

function formatActivityAt(submission: WorksheetSubmission): string {
  const ts = submission.submittedAt ?? submission.updatedAt;
  if (!ts) return "-";
  const label = submission.status === "draft" ? "수정" : "제출";
  return `${ts.toDate().toLocaleString("ko-KR")} (${label})`;
}

function studentLabel(meta: WorksheetSubmission["meta"]): string {
  const parts = [meta.grade, meta.studentNo, meta.studentName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "익명";
}

const META_LABELS: Record<string, string> = {
  grade: "학년/반",
  classNo: "반",
  studentNo: "번호",
  studentName: "이름",
  topic: "주제",
  unit: "단원",
  period: "차시",
  inquiryQuestion: "탐구질문",
  writingContext: getMetaFieldLabel("writingContext"),
  description: "설명",
};

function metaLabel(key: string): string {
  return META_LABELS[key] ?? getMetaFieldLabel(key);
}

export function TeacherDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<WorksheetSubmission[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || role !== "teacher") {
      setSubmissions([]);
      return;
    }

    let cancelled = false;
    setListLoading(true);
    setListError("");

    listTeacherSubmissions()
      .then((items) => {
        if (!cancelled) setSubmissions(items);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setListError(getFirebaseErrorMessage(error, "제출 목록을 불러오지 못했습니다."));
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, role]);

  const handleLogout = async () => {
    await signOutUser();
    window.location.href = "/login";
  };

  const handleDelete = async (submission: WorksheetSubmission) => {
    if (!submission.id) return;
    if (!window.confirm("이 학생 활동지를 삭제할까요? 삭제 후에는 복구할 수 없습니다.")) return;

    setDeletingId(submission.id);
    setListError("");

    try {
      await deleteSubmission(submission.id);
      setSubmissions((prev) => prev.filter((item) => item.id !== submission.id));
      if (expandedId === submission.id) setExpandedId(null);
    } catch (error: unknown) {
      setListError(getFirebaseErrorMessage(error, "삭제에 실패했습니다."));
    } finally {
      setDeletingId(null);
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Firebase 설정 필요</h1>
        <p className="mt-3 text-sm text-slate-600">`.env` 파일에 Firebase 환경 변수를 입력하세요.</p>
      </div>
    );
  }

  if (authLoading) {
    return <div className="px-4 py-16 text-center text-sm text-slate-500">로딩 중...</div>;
  }

  if (!user || role !== "teacher") {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          ← 로그인
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">교사 로그인</h1>
        <p className="mt-2 text-sm text-slate-600">Google 계정과 암호로 로그인하면 제출된 활동지를 조회할 수 있습니다.</p>

        <div className="mt-8">
          <TeacherLoginPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← 홈으로
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">제출 활동지 (교사)</h1>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/teacher/badges"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            칭찬 배지 관리
          </Link>
          <Link
            href="/teacher/worksheet-content"
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100"
          >
            학습지 텍스트 편집
          </Link>
          <Link
            href="/teacher/guided-questions"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
          >
            유도 질문 관리
          </Link>
          <Link
            href="/teacher/lesson-plans"
            className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100"
          >
            수업지도안 설계
          </Link>
          <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          로그아웃
        </button>
        </div>
      </div>

      {listLoading && <p className="mt-8 text-sm text-slate-500">불러오는 중...</p>}
      {listError && <p className="mt-8 text-sm text-red-600">{listError}</p>}

      {!listLoading && !listError && submissions.length === 0 && (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          아직 학생 활동지가 없습니다.
        </p>
      )}

      {!listLoading && !listError && submissions.length > 0 && (
        <TeacherDailyTable
          submissions={submissions}
          onDelete={(s) => void handleDelete(s)}
          deletingId={deletingId}
        />
      )}

      {!listLoading && !listError && submissions.length > 0 && (
        <h2 className="mt-10 text-lg font-bold text-slate-800">활동지 상세</h2>
      )}

      <div className="mt-6 space-y-3">
        {submissions.map((submission) => {
          const open = expandedId === submission.id;
          const valueEntries = Object.entries(submission.values).filter(([, value]) => value.trim().length > 0);
          const guidedEntries = valueEntries.filter(([key]) => key.startsWith("guided_q_"));
          const activityEntries = valueEntries.filter(([key]) => !key.startsWith("guided_q_"));

          return (
            <article key={submission.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left hover:bg-slate-50"
                onClick={() => setExpandedId(open ? null : submission.id ?? null)}
              >
                <div>
                  <p className="font-semibold text-slate-800">{submission.templateName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {studentLabel(submission.meta)} · {submission.meta.topic || "주제 없음"}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-slate-500">
                  <p>{formatActivityAt(submission)}</p>
                  <p className="mt-1">{open ? "접기" : "펼치기"}</p>
                </div>
              </button>

              {open && (
                <div className="border-t border-slate-100 px-4 py-4 text-sm">
                  <dl className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(submission.meta)
                      .filter(([, value]) => value && String(value).trim().length > 0)
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-xs font-semibold text-slate-500">{metaLabel(key)}</dt>
                          <dd className="mt-0.5 whitespace-pre-wrap text-slate-800">{value}</dd>
                        </div>
                      ))}
                  </dl>

                  {guidedEntries.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">유도 질문</h3>
                      {guidedEntries.map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-emerald-50 p-3">
                          <p className="text-xs font-semibold text-emerald-800">
                            질문 {Number(key.replace("guided_q_", "")) + 1}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-slate-800">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activityEntries.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">활동지 내용</h3>
                      {activityEntries.map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-500">{key}</p>
                          <p className="mt-1 whitespace-pre-wrap text-slate-800">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {submission.aiRating && submission.aiFeedback && (
                    <div className="mt-4">
                      <AiFeedbackCard rating={submission.aiRating} feedback={submission.aiFeedback} />
                    </div>
                  )}

                  <TeacherAwardBadgeQuick submission={submission} />

                  <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={deletingId === submission.id}
                      onClick={() => handleDelete(submission)}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === submission.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <TeacherInquiryReports />

      <TeacherPeerFeedbacks />
    </div>
  );
}
