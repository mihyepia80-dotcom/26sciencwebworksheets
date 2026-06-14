"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AiFeedbackCard } from "@/components/AiFeedbackCard";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import { listStudentSubmissions, type WorksheetSubmission } from "@/lib/firebase/submissions";

const META_LABELS: Record<string, string> = {
  grade: "학년/반",
  classNo: "반",
  studentNo: "번호",
  studentName: "이름",
  topic: "주제",
  unit: "단원",
  period: "차시",
  inquiryQuestion: "탐구질문",
  writingContext: "글쓰기 상황",
  description: "설명",
};

function formatDate(submission: WorksheetSubmission) {
  if (!submission.submittedAt) return "-";
  return submission.submittedAt.toDate().toLocaleString("ko-KR");
}

export default function MyWorksheetsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<WorksheetSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    listStudentSubmissions(user.uid)
      .then((items) => {
        if (!cancelled) setSubmissions(items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getFirebaseErrorMessage(err, "불러오기 실패"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen">
      <AppHeader title="내 활동지" subtitle="제출한 학습지 기록" />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← 템플릿 목록
        </Link>

        {loading && <p className="mt-8 text-sm text-slate-500">불러오는 중...</p>}
        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}

        {!loading && !error && submissions.length === 0 && (
          <p className="mt-8 rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            아직 제출한 활동지가 없습니다.
          </p>
        )}

        <div className="mt-6 space-y-3">
          {submissions.map((submission) => {
            const open = expandedId === submission.id;
            const valueEntries = Object.entries(submission.values).filter(([, v]) => v.trim());

            return (
              <article key={submission.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left hover:bg-slate-50"
                  onClick={() => setExpandedId(open ? null : submission.id ?? null)}
                >
                  <div>
                    <p className="font-semibold text-slate-800">{submission.templateName}</p>
                    <p className="mt-1 text-sm text-slate-600">{submission.meta.topic || "주제 없음"}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-slate-500">
                    <p>{formatDate(submission)}</p>
                    <Link
                      href={`/templates/${submission.templateId}?submission=${submission.id}`}
                      className="mt-2 inline-block rounded border border-blue-200 px-2 py-1 text-blue-700 hover:bg-blue-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      수정
                    </Link>
                    <p className="mt-1">{open ? "접기" : "펼치기"}</p>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-slate-100 px-4 py-4 text-sm">
                    <div className="mb-4 flex justify-end">
                      <Link
                        href={`/templates/${submission.templateId}?submission=${submission.id}`}
                        className="rounded-lg border border-blue-200 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                      >
                        수정
                      </Link>
                    </div>
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {Object.entries(submission.meta)
                        .filter(([, v]) => v && String(v).trim())
                        .map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-xs font-semibold text-slate-500">{META_LABELS[key] ?? key}</dt>
                            <dd className="mt-0.5 whitespace-pre-wrap text-slate-800">{value}</dd>
                          </div>
                        ))}
                    </dl>
                    {valueEntries.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {valueEntries.map(([key, value]) => (
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
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
