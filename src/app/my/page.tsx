"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AiFeedbackCard } from "@/components/AiFeedbackCard";
import { ShareButton } from "@/components/ShareButton";
import { AppHeader } from "@/components/AppHeader";
import { StudentGroupRoleCard } from "@/components/student/StudentGroupRoleCard";
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
      <AppHeader title="내 활동지" subtitle="제출한 학습지와 탐구보고서" />

      <main className="page-main-narrow">
        <Link href="/" className="ui-link">
          ← 홈으로
        </Link>

        <StudentGroupRoleCard />

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="ui-section-title">탐구보고서</h2>
            <Link href="/workspace" className="ui-btn-accent ui-btn-sm">
              탐구 활동실
            </Link>
          </div>

          {!loading && reports.length === 0 && (
            <p className="ui-card p-8 text-center text-base text-slate-500">
              아직 작성한 탐구보고서가 없습니다.
            </p>
          )}

          <div className="space-y-4">
            {reports.map((report) => {
              const open = expandedReportId === report.id;
              const memberNames = report.members.filter((m) => m.trim()).join(", ");

              return (
                <article key={report.id} className="ui-card overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left hover:bg-slate-50/80"
                    onClick={() => setExpandedReportId(open ? null : report.id ?? null)}
                  >
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-slate-800">{inquiryReportTitle(report)}</p>
                      <p className="mt-1 text-base text-slate-600">
                        {report.unitName || "단원 미입력"} · {report.groupNo ? `${report.groupNo}모둠` : "모둠 미입력"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={report.status === "submitted" ? "ui-status-success" : "ui-status-warn"}>
                        {report.status === "submitted" ? "제출됨" : "임시저장"}
                      </span>
                      <p className="mt-2 text-sm text-slate-500">{formatReportDate(report)}</p>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-slate-100 px-5 py-5">
                      {memberNames && <p className="text-base text-slate-600">모둠원: {memberNames}</p>}
                      <div className="mt-4 flex justify-end">
                        <Link href={`/workspace?report=${report.id}`} className="ui-btn-secondary ui-btn-sm">
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

        <section className="mt-12">
          <h2 className="ui-section-title mb-5">사고 활동지</h2>

          {loading && <p className="text-base text-slate-500">불러오는 중...</p>}
          {error && <p className="text-base text-red-600">{error}</p>}

          {!loading && !error && submissions.length === 0 && (
            <p className="ui-card p-8 text-center text-base text-slate-500">
              아직 작성한 활동지가 없습니다.
            </p>
          )}

          <div className="space-y-4">
            {submissions.map((submission) => {
              const open = expandedId === submission.id;
              const valueEntries = Object.entries(submission.values).filter(([, v]) => v.trim());

              return (
                <article key={submission.id} className="ui-card overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left hover:bg-slate-50/80"
                    onClick={() => setExpandedId(open ? null : submission.id ?? null)}
                  >
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-slate-800">{submission.templateName}</p>
                      <p className="mt-1 text-base text-slate-600">{submission.meta.topic || "주제 없음"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={submission.status === "submitted" ? "ui-status-success" : "ui-status-warn"}>
                        {submission.status === "submitted" ? "제출됨" : "임시저장"}
                      </span>
                      <p className="mt-2 text-sm text-slate-500">{formatDate(submission)}</p>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t border-slate-100 px-5 py-5">
                      <div className="mb-5 flex justify-end">
                        <Link
                          href={`/workspace?template=${submission.templateId}&submission=${submission.id}`}
                          className="ui-btn-secondary ui-btn-sm"
                        >
                          {submission.status === "submitted" ? "보기" : "이어서 작성"}
                        </Link>
                      </div>
                      <dl className="grid gap-4 sm:grid-cols-2">
                        {Object.entries(submission.meta)
                          .filter(([, v]) => v && String(v).trim())
                          .map(([key, value]) => (
                            <div key={key}>
                              <dt className="text-sm font-semibold text-slate-500">{getMetaFieldLabel(key)}</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-base text-slate-800">{value}</dd>
                            </div>
                          ))}
                      </dl>
                      {valueEntries.length > 0 && (
                        <div className="mt-5 space-y-3">
                          {valueEntries.map(([key, value]) => (
                            <div key={key} className="rounded-xl bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-500">{key}</p>
                              <p className="mt-1 whitespace-pre-wrap text-base text-slate-800">{value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {submission.status === "submitted" && submission.aiRating && submission.aiFeedback && (
                        <div className="mt-5">
                          <AiFeedbackCard rating={submission.aiRating} feedback={submission.aiFeedback} />
                        </div>
                      )}
                      {submission.status === "submitted" && user && submission.id && (
                        <div className="mt-5 border-t border-slate-100 pt-5">
                          <ShareButton submission={submission} studentUid={user.uid} />
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
