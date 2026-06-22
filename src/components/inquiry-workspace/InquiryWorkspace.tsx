"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DrawingCanvas } from "@/components/inquiry-report/DrawingCanvas";
import { WorksheetViewer } from "@/components/WorksheetViewer";
import { useAuth } from "@/components/AuthProvider";
import {
  getInquiryReport,
  getOrCreateStudentDraftReport,
  linkSubmissionToReport,
  updateInquiryReport,
} from "@/lib/firebase/inquiry-reports";
import { sanitizeInquiryReportForSave } from "@/lib/firebase/inquiry-report-shares";
import {
  getNextInstanceNo,
  listSubmissionsForReport,
  saveSubmissionDraft,
  type WorksheetSubmission,
} from "@/lib/firebase/submissions";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import { getTemplateById } from "@/lib/templates/registry";
import { formatTemplateTitle } from "@/lib/templates/curriculum";
import {
  CONSOLIDATED_INQUIRY_SECTIONS,
  EMPTY_CONSOLIDATED_INQUIRY,
  fromConsolidatedForm,
  prefillConsolidatedFromWorksheet,
  toConsolidatedForm,
  validateConsolidatedInquiry,
  type ConsolidatedInquiryForm,
} from "@/lib/inquiry-workspace/consolidated-form";
import { isGuest, isLoggedInStudent } from "@/lib/auth/access";
import { GuestNotice } from "@/components/common/GuestNotice";

type PanelFocus = "split" | "worksheet" | "report";

const TEXTAREA = "ui-textarea";

function panelToggle(active: boolean, activeClass: string) {
  return active
    ? `${activeClass} text-white shadow-sm`
    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
}

export function InquiryWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role, studentProfile } = useAuth();
  const isStudent = isLoggedInStudent(user, role);
  const guestMode = isGuest(user, role);
  const canPersist = isStudent;

  const templateId = searchParams.get("template") ?? "";
  const submissionIdParam = searchParams.get("submission");
  const forceNew = searchParams.get("new") === "1";
  const reportParam = searchParams.get("report");

  const [reportId, setReportId] = useState<string | null>(reportParam);
  const [worksheets, setWorksheets] = useState<WorksheetSubmission[]>([]);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(submissionIdParam);
  const [activeTemplateId, setActiveTemplateId] = useState(templateId);
  const [form, setForm] = useState<ConsolidatedInquiryForm>(EMPTY_CONSOLIDATED_INQUIRY);
  const [panelFocus, setPanelFocus] = useState<PanelFocus>("split");
  const [initLoading, setInitLoading] = useState(true);
  const [reportSaving, setReportSaving] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refreshWorksheets = useCallback(async (rid: string) => {
    if (!user) return [];
    const items = await listSubmissionsForReport(user.uid, rid);
    setWorksheets(items);
    return items;
  }, [user]);

  useEffect(() => {
    if (guestMode) {
      setInitLoading(false);
      setError("");
      if (templateId) setActiveTemplateId(templateId);
      return;
    }

    if (!isStudent || !user) {
      setInitLoading(false);
      return;
    }

    let cancelled = false;
    setInitLoading(true);
    setError("");

    void (async () => {
      try {
        let rid = reportParam;
        if (!rid) {
          rid = await getOrCreateStudentDraftReport(
            user.uid,
            studentProfile?.grade ?? "",
            studentProfile?.classNo ?? "",
          );
        }
        if (cancelled) return;
        setReportId(rid);

        const doc = await getInquiryReport(rid);
        if (doc && doc.studentUid === user.uid) {
          setForm(toConsolidatedForm(doc));
          setReportSubmitted(doc.status === "submitted");
        }

        const items = await refreshWorksheets(rid);
        if (cancelled) return;

        if (templateId) {
          setActiveTemplateId(templateId);
          if (submissionIdParam) {
            setActiveSubmissionId(submissionIdParam);
          } else if (forceNew) {
            const instanceNo = await getNextInstanceNo(user.uid, templateId, rid);
            const tpl = getTemplateById(templateId);
            const newId = await saveSubmissionDraft({
              templateId,
              templateName: tpl?.name ?? templateId,
              meta: {
                grade: studentProfile?.grade ?? "",
                classNo: studentProfile?.classNo ?? "",
                studentNo: studentProfile?.studentNo ?? "",
                studentName: studentProfile?.studentName ?? "",
                topic: "",
              },
              values: {},
              studentUid: user.uid,
              linkedReportId: rid,
              instanceNo,
            });
            await linkSubmissionToReport(rid, newId);
            setActiveSubmissionId(newId);
            await refreshWorksheets(rid);
            router.replace(
              `/workspace?report=${rid}&template=${templateId}&submission=${newId}`,
              { scroll: false },
            );
          } else {
            const match = items.find(
              (w) => w.templateId === templateId && w.status === "draft",
            );
            if (match?.id) {
              setActiveSubmissionId(match.id);
              router.replace(
                `/workspace?report=${rid}&template=${templateId}&submission=${match.id}`,
                { scroll: false },
              );
            }
          }
        } else if (items.length > 0 && !templateId) {
          const first = items[0];
          setActiveTemplateId(first.templateId);
          setActiveSubmissionId(first.id ?? null);
        }
      } catch (e: unknown) {
        if (!cancelled) setError(getFirebaseErrorMessage(e, "탐구 활동실을 불러오지 못했습니다."));
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    forceNew,
    guestMode,
    isStudent,
    refreshWorksheets,
    reportParam,
    role,
    router,
    studentProfile?.classNo,
    studentProfile?.grade,
    studentProfile?.studentName,
    studentProfile?.studentNo,
    submissionIdParam,
    templateId,
    user,
  ]);

  const patchForm = <K extends keyof ConsolidatedInquiryForm>(key: K, value: ConsolidatedInquiryForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleWorksheetSaved = useCallback(
    async (submission: WorksheetSubmission) => {
      if (!reportId || !submission.id) return;
      await linkSubmissionToReport(reportId, submission.id);
      const items = await refreshWorksheets(reportId);
      setForm((prev) =>
        prefillConsolidatedFromWorksheet(prev, submission.meta, submission.values),
      );
      if (!activeSubmissionId) setActiveSubmissionId(submission.id);
      void items;
    },
    [activeSubmissionId, reportId, refreshWorksheets],
  );

  const handleAddSameTemplate = async (tid: string) => {
    if (!user || !reportId) return;
    const instanceNo = await getNextInstanceNo(user.uid, tid, reportId);
    const tpl = getTemplateById(tid);
    const newId = await saveSubmissionDraft({
      templateId: tid,
      templateName: tpl?.name ?? tid,
      meta: {
        grade: studentProfile?.grade ?? "",
        classNo: studentProfile?.classNo ?? "",
        studentNo: studentProfile?.studentNo ?? "",
        studentName: studentProfile?.studentName ?? "",
        topic: "",
      },
      values: {},
      studentUid: user.uid,
      linkedReportId: reportId,
      instanceNo,
    });
    await linkSubmissionToReport(reportId, newId);
    await refreshWorksheets(reportId);
    setActiveTemplateId(tid);
    setActiveSubmissionId(newId);
    setPanelFocus("worksheet");
    router.replace(`/workspace?report=${reportId}&template=${tid}&submission=${newId}`, { scroll: false });
  };

  const handleSaveReport = async () => {
    if (!canPersist || !user || !reportId) {
      setError("학생 로그인 후 탐구보고서를 저장할 수 있습니다.");
      return;
    }
    setReportSaving(true);
    setError("");
    try {
      const storage = fromConsolidatedForm(form);
      await updateInquiryReport(
        reportId,
        sanitizeInquiryReportForSave(storage),
        user.uid,
        reportSubmitted ? "submitted" : "draft",
        studentProfile?.grade ?? "",
        studentProfile?.classNo ?? "",
      );
      setMessage("탐구보고서가 저장되었습니다.");
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "저장 실패"));
    } finally {
      setReportSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!canPersist || !user || !reportId) {
      setError("학생 로그인 후 탐구보고서를 제출할 수 있습니다.");
      return;
    }
    const errors = validateConsolidatedInquiry(form);
    if (errors.length) {
      setError(errors.slice(0, 4).join("\n"));
      setPanelFocus("report");
      return;
    }
    setReportSubmitting(true);
    setError("");
    try {
      const storage = fromConsolidatedForm(form);
      await updateInquiryReport(
        reportId,
        sanitizeInquiryReportForSave(storage),
        user.uid,
        "submitted",
        studentProfile?.grade ?? "",
        studentProfile?.classNo ?? "",
      );
      setReportSubmitted(true);
      setMessage("탐구보고서 제출이 완료되었습니다!");
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "제출 실패"));
    } finally {
      setReportSubmitting(false);
    }
  };

  if (role === "teacher" || role === "teacher-pending") {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <p className="text-base text-slate-600">교사 계정은 탐구 활동실 대신 교사 대시보드를 이용하세요.</p>
        <Link href="/teacher" className="ui-link mt-4 inline-block">
          교사 대시보드
        </Link>
      </div>
    );
  }

  if (initLoading) {
    return <p className="py-24 text-center text-base text-slate-500">탐구 활동실을 준비하는 중…</p>;
  }

  const showWorksheet = panelFocus === "split" || panelFocus === "worksheet";
  const showReport = panelFocus === "split" || panelFocus === "report";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="ui-link shrink-0">
              ← 홈
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">탐구 활동실</h1>
              <p className="text-sm text-slate-500">사고 활동지 · 탐구보고서</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPanelFocus("split")}
              className={`ui-btn-sm rounded-xl px-4 py-2 text-sm font-medium ${panelToggle(panelFocus === "split", "bg-slate-800")}`}
            >
              2분할
            </button>
            <button
              type="button"
              onClick={() => setPanelFocus("worksheet")}
              className={`ui-btn-sm rounded-xl px-4 py-2 text-sm font-medium ${panelToggle(panelFocus === "worksheet", "bg-blue-600")}`}
            >
              활동지
            </button>
            <button
              type="button"
              onClick={() => setPanelFocus("report")}
              className={`ui-btn-sm rounded-xl px-4 py-2 text-sm font-medium ${panelToggle(panelFocus === "report", "bg-violet-600")}`}
            >
              탐구보고서
            </button>
          </div>
        </div>
      </header>

      {guestMode && (
        <div className="border-b border-amber-100 bg-amber-50/60 px-5 py-3">
          <GuestNotice compact />
        </div>
      )}

      <div
        className={`mx-auto grid w-full max-w-[1600px] flex-1 gap-0 ${
          panelFocus === "split" ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]" : "grid-cols-1"
        }`}
      >
        {showWorksheet && (
          <section className="flex min-h-0 flex-col border-r border-slate-200/80 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-800">사고 활동지</h2>
              <p className="mt-1 text-sm text-slate-500">작성 후 오른쪽 탐구보고서를 완성하세요.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {canPersist &&
                  worksheets.map((w) => {
                  const tpl = getTemplateById(w.templateId);
                  const label = tpl ? formatTemplateTitle(tpl) : w.templateName;
                  const suffix = w.instanceNo && w.instanceNo > 1 ? ` #${w.instanceNo}` : "";
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setActiveTemplateId(w.templateId);
                        setActiveSubmissionId(w.id ?? null);
                        router.replace(
                          `/workspace?report=${reportId}&template=${w.templateId}&submission=${w.id}`,
                          { scroll: false },
                        );
                      }}
                      className={`ui-chip ${
                        w.id === activeSubmissionId
                          ? "bg-blue-100 font-semibold text-blue-800"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {label}
                      {suffix}
                      {w.status === "submitted" ? " ✓" : ""}
                    </button>
                  );
                })}
                {canPersist && activeTemplateId && (
                  <button
                    type="button"
                    title="같은 유형 활동지 추가"
                    onClick={() => void handleAddSameTemplate(activeTemplateId)}
                    className="ui-chip border border-dashed border-blue-300 font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    + 같은 유형
                  </button>
                )}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {activeTemplateId ? (
                <WorksheetViewer
                  key={`${activeTemplateId}-${activeSubmissionId ?? "new"}`}
                  templateId={activeTemplateId}
                  embedded
                  linkedReportId={reportId ?? undefined}
                  editSubmissionId={activeSubmissionId}
                  onDraftSaved={handleWorksheetSaved}
                  onSubmitted={handleWorksheetSaved}
                />
              ) : (
                <p className="py-16 text-center text-base text-slate-500">
                  홈에서 사고 활동지를 선택하거나 + 버튼으로 추가하세요.
                </p>
              )}
            </div>
          </section>
        )}

        {showReport && (
          <section className="flex min-h-0 flex-col bg-slate-50/80">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-violet-900">탐구보고서</h2>
                <p className="text-sm text-slate-500">9개 섹션으로 정리된 보고서</p>
              </div>
              <div className="flex gap-2">
                {canPersist ? (
                  <>
                    <button
                      type="button"
                      disabled={reportSaving || reportSubmitted}
                      onClick={() => void handleSaveReport()}
                      className="ui-btn-secondary ui-btn-sm"
                    >
                      {reportSaving ? "저장 중…" : "저장"}
                    </button>
                    <button
                      type="button"
                      disabled={reportSubmitting || reportSubmitted}
                      onClick={() => void handleSubmitReport()}
                      className="ui-btn-accent ui-btn-sm"
                    >
                      {reportSubmitted ? "제출됨" : reportSubmitting ? "제출 중…" : "제출"}
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="ui-btn-primary ui-btn-sm">
                    학생 로그인
                  </Link>
                )}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="mx-auto max-w-xl space-y-5 pb-16">
                <section className="ui-card p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="ui-label">단원명</span>
                      <input className="ui-input" value={form.unitName} disabled={reportSubmitted} onChange={(e) => patchForm("unitName", e.target.value)} />
                    </label>
                    <label>
                      <span className="ui-label">차시명</span>
                      <input className="ui-input" value={form.lessonName} disabled={reportSubmitted} onChange={(e) => patchForm("lessonName", e.target.value)} />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <input className="ui-input w-20 text-center" placeholder="모둠" value={form.groupNo} disabled={reportSubmitted} onChange={(e) => patchForm("groupNo", e.target.value)} />
                    <input className="ui-input min-w-[8rem] flex-1" placeholder="기록자" value={form.recorder} disabled={reportSubmitted} onChange={(e) => patchForm("recorder", e.target.value)} />
                  </div>
                </section>

                {CONSOLIDATED_INQUIRY_SECTIONS.map((s) => (
                  <section key={s.id} className="ui-card p-5">
                    <p className="mb-1 text-sm font-medium text-slate-400">{s.group}</p>
                    <h3 className="mb-3 text-base font-bold text-slate-800">
                      {s.num}. {s.label}
                    </h3>
                    {s.id === "process" ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const key = `processStep${n}` as keyof ConsolidatedInquiryForm;
                          return (
                            <textarea
                              key={n}
                              className={TEXTAREA}
                              rows={2}
                              placeholder={`${n}단계`}
                              value={form[key] as string}
                              disabled={reportSubmitted}
                              onChange={(e) => patchForm(key, e.target.value as ConsolidatedInquiryForm[typeof key])}
                            />
                          );
                        })}
                      </div>
                    ) : s.id === "visual" ? (
                      <>
                        <DrawingCanvas
                          value={form.visualDrawing}
                          readOnly={reportSubmitted}
                          onChange={(v) => patchForm("visualDrawing", v)}
                        />
                        <textarea
                          className={`${TEXTAREA} mt-2`}
                          rows={2}
                          placeholder="그림 설명"
                          value={form.visualDescription}
                          disabled={reportSubmitted}
                          onChange={(e) => patchForm("visualDescription", e.target.value)}
                        />
                      </>
                    ) : (
                      <textarea
                        className={TEXTAREA}
                        rows={s.id === "curious" || s.id === "result" || s.id === "learned" ? 4 : 3}
                        value={
                          s.id === "curious"
                            ? form.curiousCombined
                            : s.id === "problem"
                              ? form.inquiryProblem
                              : s.id === "prior"
                                ? form.priorKnowledge
                                : s.id === "result"
                                  ? form.resultCombined
                                  : s.id === "learned"
                                    ? form.learnedCombined
                                    : s.id === "more"
                                      ? form.wantToKnowMore
                                      : form.realLifeStory
                        }
                        disabled={reportSubmitted}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (s.id === "curious") patchForm("curiousCombined", v);
                          else if (s.id === "problem") patchForm("inquiryProblem", v);
                          else if (s.id === "prior") patchForm("priorKnowledge", v);
                          else if (s.id === "result") patchForm("resultCombined", v);
                          else if (s.id === "learned") patchForm("learnedCombined", v);
                          else if (s.id === "more") patchForm("wantToKnowMore", v);
                          else patchForm("realLifeStory", v);
                        }}
                      />
                    )}
                  </section>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {(message || error) && (
        <div className="border-t border-slate-200/80 bg-white px-5 py-3 text-center text-base">
          {message && <p className="text-emerald-700">{message}</p>}
          {error && <p className="whitespace-pre-line text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
