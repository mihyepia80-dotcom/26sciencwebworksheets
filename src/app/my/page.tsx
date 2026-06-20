"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AiFeedbackCard } from "@/components/AiFeedbackCard";
import { ShareButton } from "@/components/ShareButton";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import { listStudentSubmissions, type WorksheetSubmission } from "@/lib/firebase/submissions";
import {
  listStudentInquiryReports,
  type InquiryReportDoc,
} from "@/lib/firebase/inquiry-reports";
import { getMetaFieldLabel } from "@/lib/meta-labels";
import { inquiryReportTitle } from "@/lib/inquiry-report/types";

function formatDate(submission: WorksheetSubmission) {
  const ts = submission.updatedAt ?? submission.submittedAt;
  if (!ts) return "-";
  return ts.toDate().toLocaleString("ko-KR");
}

function formatReportDate(report: InquiryReportDoc) {
  const ts = report.submittedAt ?? report.updatedAt;
  if (!ts) return "-";
  return ts.toDate().toLocaleString("ko-KR");
}

export default function MyWorksheetsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<WorksheetSubmission[]>([]);
  const [reports, setReports] = useState<InquiryReportDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

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
      });

    listStudentInquiryReports(user.uid)
      .then((items) => {
        if (!cancelled) setReports(items);
      })
      .catch(() => {
        /* 탐구보고서 목록 실패는 활동지와 별도 */
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

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-800">내 탐구보고서</h2>
            <Link
              href="/workspace"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              탐구 활동실
            </Link>
          </div>

          {!loading && reports.length === 0 && (
            <p className="mt-4 rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              아직 작성한 탐구보고서가 없습니다.
            </p>
          )}

          <div className="mt-4 space-y-3">
            {reports.map((report) => {
              const open = expandedReportId === report.id;
              const memberNames = report.members.filter((m) => m.trim()).join(", ");

              return (
                <article
                  key={report.id}
                  className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left hover:bg-violet-50/50"
                    onClick={() => setExpandedReportId(open ? null : report.id ?? null)}
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{inquiryReportTitle(report)}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {report.unitName || "단원 미입력"} · {report.groupNo ? `${report.groupNo}모둠` : "모둠 미입력"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-500">
                      <span
                        className={`inline-block rounded px-2 py-0.5 ${
                          report.status === "submitted"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {report.status === "submitted" ? "제출됨" : "임시저장"}
                      </span>
                      <p className="mt-2">{formatReportDate(report)}</p>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-slate-100 px-4 py-4 text-sm">
                      {memberNames && <p className="text-slate-600">모둠원: {memberNames}</p>}
                      <div className="mt-4 flex justify-end">
                        <Link
                          href={`/workspace?report=${report.id}`}
                          className="rounded-lg border border-violet-200 px-4 py-2 text-sm text-violet-700 hover:bg-violet-50"
                        >
                          {report.status === "submitted" ? "보기" : "이어서 작성"}
                        </Link>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <h2 className="mt-10 text-lg font-bold text-slate-800">내 활동지</h2>

        {loading && <p className="mt-8 text-sm text-slate-500">불러오는 중...</p>}
        {error && <p className="mt-8 text-sm text-red-600">{error}</p>}

        {!loading && !error && submissions.length === 0 && (
          <p className="mt-8 rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            아직 작성한 활동지가 없습니다.
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
                    <span
                      className={`inline-block rounded px-2 py-0.5 ${
                        submission.status === "submitted"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {submission.status === "submitted" ? "제출됨" : "임시저장"}
                    </span>
                    <p className="mt-2">{formatDate(submission)}</p>
                    <Link
                      href={`/workspace?template=${submission.templateId}&submission=${submission.id}`}
                      className="mt-2 inline-block rounded border border-blue-200 px-2 py-1 text-blue-700 hover:bg-blue-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {submission.status === "submitted" ? "보기" : "이어서 작성"}
                    </Link>
                    <p className="mt-1">{open ? "접기" : "펼치기"}</p>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-slate-100 px-4 py-4 text-sm">
                    <div className="mb-4 flex justify-end">
                      <Link
                        href={`/workspace?template=${submission.templateId}&submission=${submission.id}`}
                        className="rounded-lg border border-blue-200 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                      >
                        {submission.status === "submitted" ? "보기" : "이어서 작성"}
                      </Link>
                    </div>
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {Object.entries(submission.meta)
                        .filter(([, v]) => v && String(v).trim())
                        .map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-xs font-semibold text-slate-500">{getMetaFieldLabel(key)}</dt>
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
                    {submission.status === "submitted" && submission.aiRating && submission.aiFeedback && (
                      <div className="mt-4">
                        <AiFeedbackCard rating={submission.aiRating} feedback={submission.aiFeedback} />
                      </div>
                    )}
                    {submission.status === "submitted" && user && submission.id && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <ShareButton submission={submission} studentUid={user.uid} />
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
