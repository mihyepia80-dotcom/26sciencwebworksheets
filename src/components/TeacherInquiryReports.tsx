"use client";

import { useEffect, useState } from "react";
import {
  deleteInquiryReport,
  getFirebaseErrorMessage,
  listAllInquiryReports,
  type InquiryReportDoc,
} from "@/lib/firebase";
import { inquiryReportTitle } from "@/lib/inquiry-report/types";

function formatDate(report: InquiryReportDoc): string {
  const ts = report.submittedAt ?? report.updatedAt;
  if (!ts) return "-";
  return ts.toDate().toLocaleString("ko-KR");
}

const REPORT_FIELDS: { label: string; key: keyof InquiryReportDoc }[] = [
  { label: "모둠 번호", key: "groupNo" },
  { label: "기록자", key: "recorder" },
  { label: "단원명", key: "unitName" },
  { label: "차시명", key: "lessonName" },
  { label: "궁금한 내용", key: "curiousContent" },
  { label: "탐구 문제", key: "inquiryProblem" },
  { label: "알고 있는 것", key: "priorKnowledge" },
  { label: "탐구 결과", key: "inquiryResult" },
  { label: "알게 된 점", key: "learnedAfter" },
  { label: "더 알고 싶은 점", key: "wantToKnowMore" },
  { label: "이번 시간 배운 내용", key: "classLearned" },
  { label: "가장 궁금했던 내용", key: "mostCurious" },
  { label: "탐구 결과 정리", key: "resultOrganized" },
  { label: "생활 속 이야기", key: "realLifeStory" },
];

const PROCESS_STEP_KEYS = [
  "processStep1",
  "processStep2",
  "processStep3",
  "processStep4",
  "processStep5",
] as const;

export function TeacherInquiryReports() {
  const [reports, setReports] = useState<InquiryReportDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    listAllInquiryReports()
      .then((items) => {
        if (!cancelled) setReports(items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getFirebaseErrorMessage(err, "탐구보고서 목록을 불러오지 못했습니다."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (report: InquiryReportDoc) => {
    if (!report.id) return;
    if (!window.confirm("이 탐구보고서를 삭제할까요? 삭제 후에는 복구할 수 없습니다.")) return;

    setDeletingId(report.id);
    setError("");

    try {
      await deleteInquiryReport(report.id);
      setReports((prev) => prev.filter((item) => item.id !== report.id));
      if (expandedId === report.id) setExpandedId(null);
    } catch (err: unknown) {
      setError(getFirebaseErrorMessage(err, "삭제에 실패했습니다."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-slate-800">탐구보고서</h2>
      <p className="mt-1 text-sm text-slate-500">학생이 제출한 탐구보고서입니다.</p>

      {loading && <p className="mt-4 text-sm text-slate-500">불러오는 중...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && !error && reports.length === 0 && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          아직 제출된 탐구보고서가 없습니다.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {reports.map((report) => {
          const open = expandedId === report.id;
          const members = report.members.filter((m) => m.trim()).join(", ");
          const processSteps = PROCESS_STEP_KEYS.map((key, index) => ({
            label: `탐구 과정 ${index + 1}단계`,
            value: report[key].trim(),
          })).filter((step) => step.value);

          return (
            <article key={report.id} className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left hover:bg-violet-50/40"
                onClick={() => setExpandedId(open ? null : report.id ?? null)}
              >
                <div>
                  <p className="font-semibold text-slate-800">{inquiryReportTitle(report)}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {report.unitName || "단원 미입력"} · {report.groupNo ? `${report.groupNo}모둠` : "모둠 미입력"} · 기록자 {report.recorder || "-"}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-slate-500">
                  <span
                    className={`inline-block rounded px-2 py-0.5 ${
                      report.status === "submitted" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {report.status === "submitted" ? "제출됨" : "임시저장"}
                  </span>
                  <p className="mt-2">{formatDate(report)}</p>
                  <p className="mt-1">{open ? "접기" : "펼치기"}</p>
                </div>
              </button>

              {open && (
                <div className="space-y-4 border-t border-slate-100 px-4 py-4 text-sm">
                  {members && (
                    <p>
                      <span className="font-medium text-slate-600">모둠원:</span> {members}
                    </p>
                  )}
                  {REPORT_FIELDS.map(({ label, key }) => (
                    <ReportField key={key} label={label} value={String(report[key] ?? "")} />
                  ))}
                  {processSteps.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">탐구 과정</p>
                      {processSteps.map((step) => (
                        <ReportField key={step.label} label={step.label} value={step.value} />
                      ))}
                    </div>
                  )}
                  {report.visualDrawing && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-slate-500">그림으로 나타내기</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={report.visualDrawing} alt="학생 그림" className="max-h-80 rounded border border-slate-200 bg-white" />
                    </div>
                  )}
                  <ReportField label="그림 설명" value={report.visualDescription} />
                  <div className="flex justify-end border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={deletingId === report.id}
                      onClick={() => handleDelete(report)}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === report.id ? "삭제 중..." : "삭제"}
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

function ReportField({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-slate-800">{value}</p>
    </div>
  );
}
