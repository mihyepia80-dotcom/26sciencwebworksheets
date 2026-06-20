"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DrawingCanvas } from "@/components/inquiry-report/DrawingCanvas";
import { PeerFeedbackSection } from "@/components/peer-feedback/PeerFeedbackSection";
import { useAuth } from "@/components/AuthProvider";
import {
  createInquiryReportDraft,
  getInquiryReport,
  updateInquiryReport,
} from "@/lib/firebase/inquiry-reports";
import {
  createInquiryReportShareLink,
  sanitizeInquiryReportForSave,
} from "@/lib/firebase/inquiry-report-shares";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import {
  EMPTY_INQUIRY_REPORT,
  INQUIRY_SECTIONS,
  validateInquiryReport,
  type InquiryReportForm,
} from "@/lib/inquiry-report/types";

const TEXTAREA =
  "w-full resize-y rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none";

type ViewMode = "write" | "preview";
type ZoomLevel = 100 | 125 | 150;

const TOOL_BUTTON =
  "flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-100";

export function InquiryReportEditor({ initialReportId }: { initialReportId?: string | null }) {
  const router = useRouter();
  const { user, role, studentProfile } = useAuth();
  const [form, setForm] = useState<InquiryReportForm>(EMPTY_INQUIRY_REPORT);
  const [reportId, setReportId] = useState<string | null>(initialReportId ?? null);
  const [mode, setMode] = useState<ViewMode>("write");
  const [zoom, setZoom] = useState<ZoomLevel>(100);
  const [activeSection, setActiveSection] = useState("curious");
  const [loading, setLoading] = useState(Boolean(initialReportId));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const readOnly = mode === "preview" || submitted;

  useEffect(() => {
    if (!initialReportId || !user) {
      setLoading(false);
      return;
    }
    getInquiryReport(initialReportId)
      .then((doc) => {
        if (!doc || doc.studentUid !== user.uid) {
          setError("보고서를 불러올 수 없습니다.");
          return;
        }
        setForm({
          groupNo: doc.groupNo,
          members: doc.members,
          recorder: doc.recorder,
          unitName: doc.unitName,
          lessonName: doc.lessonName,
          curiousContent: doc.curiousContent,
          inquiryProblem: doc.inquiryProblem,
          priorKnowledge: doc.priorKnowledge,
          processStep1: doc.processStep1,
          processStep2: doc.processStep2,
          processStep3: doc.processStep3,
          processStep4: doc.processStep4,
          processStep5: doc.processStep5,
          inquiryResult: doc.inquiryResult,
          learnedAfter: doc.learnedAfter,
          wantToKnowMore: doc.wantToKnowMore,
          classLearned: doc.classLearned,
          mostCurious: doc.mostCurious,
          resultOrganized: doc.resultOrganized,
          realLifeStory: doc.realLifeStory,
          visualDrawing: doc.visualDrawing,
          visualDescription: doc.visualDescription,
        });
        setReportId(doc.id ?? initialReportId);
        setSubmitted(doc.status === "submitted");
        if (doc.status === "submitted") setMode("preview");
      })
      .catch(() => setError("불러오기 실패"))
      .finally(() => setLoading(false));
  }, [initialReportId, user]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const sections = root.querySelectorAll<HTMLElement>("[data-section]");
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target) {
          setActiveSection(visible[0].target.getAttribute("data-section") ?? "curious");
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  const ensureReportId = useCallback(async (): Promise<string> => {
    if (reportId) return reportId;
    if (!user) throw new Error("로그인이 필요합니다.");
    const safeForm = sanitizeInquiryReportForSave(form);
    const id = await createInquiryReportDraft(
      safeForm,
      user.uid,
      studentProfile?.grade ?? "",
      studentProfile?.classNo ?? "",
    );
    setReportId(id);
    router.replace(`/inquiry-report?report=${id}`, { scroll: false });
    return id;
  }, [form, reportId, router, studentProfile?.classNo, studentProfile?.grade, user]);

  const patch = <K extends keyof InquiryReportForm>(key: K, value: InquiryReportForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePdfSave = () => {
    setMode("preview");
    setMessage("");
    window.setTimeout(() => window.print(), 300);
  };

  const handleSave = async () => {
    if (!user || role !== "student") {
      setError("학생 로그인 후 저장할 수 있습니다.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const safeForm = sanitizeInquiryReportForSave(form);
      const id = await ensureReportId();
      await updateInquiryReport(
        id,
        safeForm,
        user.uid,
        submitted ? "submitted" : "draft",
        studentProfile?.grade ?? "",
        studentProfile?.classNo ?? "",
      );
      const token = await createInquiryReportShareLink(id, user.uid, safeForm);
      const url = `${window.location.origin}/inquiry-report/view/${token}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setMessage("저장되었습니다. 미리보기 공유 링크가 복사되었습니다.");
      } catch {
        setMessage("저장되었습니다. 아래 공유 링크를 복사해 사용하세요.");
      }
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "저장에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("공유 링크가 복사되었습니다.");
    } catch {
      setError("링크 복사에 실패했습니다. 주소를 직접 복사해 주세요.");
    }
  };

  const handleSubmit = async () => {
    if (!user || role !== "student") {
      setError("학생 로그인 후 제출할 수 있습니다.");
      return;
    }
    const errors = validateInquiryReport(form);
    if (errors.length) {
      setError(errors.slice(0, 4).join("\n"));
      return;
    }
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const safeForm = sanitizeInquiryReportForSave(form);
      const id = await ensureReportId();
      await updateInquiryReport(
        id,
        safeForm,
        user.uid,
        "submitted",
        studentProfile?.grade ?? "",
        studentProfile?.classNo ?? "",
      );
      const token = await createInquiryReportShareLink(id, user.uid, safeForm);
      setShareUrl(`${window.location.origin}/inquiry-report/view/${token}`);
      setSubmitted(true);
      setMode("preview");
      setMessage("제출이 완료되었습니다! 공유 링크로 미리보기할 수 있습니다.");
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "제출에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cycleZoom = () => {
    setZoom((z) => (z === 100 ? 125 : z === 125 ? 150 : 100));
  };

  if (loading) {
    return <p className="py-20 text-center text-sm text-slate-500">불러오는 중...</p>;
  }

  return (
    <div className="inquiry-report-editor flex min-h-screen flex-col bg-slate-100 print:bg-white">
      {/* 상단 메뉴바 */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← 홈
            </Link>
            <h1 className="text-lg font-bold text-slate-900">학생용 탐구보고서</h1>
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className={`${TOOL_BUTTON} ${mode === "write" && !submitted ? "bg-blue-50 text-blue-700" : ""}`}
              onClick={() => setMode("write")}
              disabled={submitted}
            >
              쓰기
            </button>
            <button
              type="button"
              className={`${TOOL_BUTTON} ${mode === "preview" ? "bg-blue-50 text-blue-700" : ""}`}
              onClick={() => setMode("preview")}
            >
              미리보기
            </button>
            <button type="button" className={TOOL_BUTTON} onClick={cycleZoom}>
              화면확대 ({zoom}%)
            </button>
            <button type="button" className={TOOL_BUTTON} onClick={handlePdfSave}>
              PDF 저장
            </button>
            <button
              type="button"
              className={`${TOOL_BUTTON} bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
        {shareUrl && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 print:hidden">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-slate-600">미리보기 공유 링크</span>
              <a href={shareUrl} target="_blank" rel="noreferrer" className="break-all text-blue-600 hover:underline">
                {shareUrl}
              </a>
              <button
                type="button"
                onClick={() => void handleCopyShareLink()}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-600 hover:bg-slate-100"
              >
                링크 복사
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 print:max-w-none">
        {/* 왼쪽 목차 */}
        <aside className="hidden w-48 shrink-0 border-r border-slate-200 bg-white py-6 pl-4 pr-2 lg:block print:hidden">
          <p className="mb-3 text-sm font-bold text-slate-800">목차</p>
          <nav className="space-y-1">
            {INQUIRY_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeSection === s.id
                    ? "bg-blue-50 font-medium text-blue-800"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s.num}. {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* 본문 */}
        <main
          id="inquiry-report-print"
          ref={contentRef}
          className="inquiry-report-print flex-1 overflow-y-auto px-4 py-6 print:overflow-visible"
          style={{ transform: zoom === 100 ? undefined : `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          <div className="mx-auto max-w-3xl space-y-5 pb-24">
            {/* 단원·차시·모둠 정보 */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:shadow-none">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">단원명</span>
                  <input
                    className="w-full rounded border border-slate-200 px-3 py-2"
                    placeholder="예: 3. 용해와 용액"
                    value={form.unitName}
                    disabled={readOnly}
                    onChange={(e) => patch("unitName", e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-700">차시명</span>
                  <input
                    className="w-full rounded border border-slate-200 px-3 py-2"
                    placeholder="예: 4~5차시"
                    value={form.lessonName}
                    disabled={readOnly}
                    onChange={(e) => patch("lessonName", e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">(</span>
                  <input
                    className="w-12 rounded border border-slate-200 px-2 py-1 text-center"
                    placeholder="모둠"
                    value={form.groupNo}
                    disabled={readOnly}
                    onChange={(e) => patch("groupNo", e.target.value)}
                  />
                  <span className="font-medium text-slate-700">) 모둠</span>
                </label>
                <span className="text-slate-400">|</span>
                <label className="flex items-center gap-2">
                  <span className="text-slate-600">기록자</span>
                  <input
                    className="rounded border border-slate-200 px-2 py-1"
                    placeholder="이름"
                    value={form.recorder}
                    disabled={readOnly}
                    onChange={(e) => patch("recorder", e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {form.members.map((name, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-14 shrink-0 text-slate-500">모둠원{i + 1}</span>
                    <input
                      className="flex-1 rounded border border-slate-200 px-2 py-1"
                      placeholder={`이름 (${i + 1}번)`}
                      value={name}
                      disabled={readOnly}
                      onChange={(e) => {
                        const next = [...form.members];
                        next[i] = e.target.value;
                        patch("members", next);
                      }}
                    />
                  </label>
                ))}
              </div>
            </section>

            <p className="text-center text-xs font-medium text-slate-500">탐구 활동 기록</p>

            <SectionCard id="curious" num={1} title="궁금한 내용을 적으세요" marker="◆">
              <textarea className={TEXTAREA} rows={4} value={form.curiousContent} disabled={readOnly} onChange={(e) => patch("curiousContent", e.target.value)} />
            </SectionCard>

            <SectionCard id="problem" num={2} title="탐구 문제는 무엇인가요?" marker="◆">
              <textarea className={TEXTAREA} rows={3} value={form.inquiryProblem} disabled={readOnly} onChange={(e) => patch("inquiryProblem", e.target.value)} />
            </SectionCard>

            <SectionCard id="prior" num={3} title="탐구 내용과 관련하여 내가 알고 있는 것을 적으세요" marker="◆">
              <textarea className={TEXTAREA} rows={4} value={form.priorKnowledge} disabled={readOnly} onChange={(e) => patch("priorKnowledge", e.target.value)} />
            </SectionCard>

            <SectionCard id="process" num={4} title="탐구 과정을 적어보세요" marker="◆">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const key = `processStep${n}` as keyof InquiryReportForm;
                  return (
                    <label key={n} className="flex items-start gap-2 text-sm">
                      <span className="mt-3 w-4 shrink-0 text-slate-400">-</span>
                      <textarea
                        className={TEXTAREA}
                        rows={2}
                        placeholder={`${n}단계`}
                        value={form[key] as string}
                        disabled={readOnly}
                        onChange={(e) => patch(key, e.target.value as InquiryReportForm[typeof key])}
                      />
                    </label>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard id="result" num={5} title="탐구 결과를 적으세요" marker="◆">
              <textarea className={TEXTAREA} rows={4} value={form.inquiryResult} disabled={readOnly} onChange={(e) => patch("inquiryResult", e.target.value)} />
            </SectionCard>

            <SectionCard id="learned" num={6} title="탐구 후 알게 된 점을 적으세요" marker="◆">
              <textarea className={TEXTAREA} rows={4} value={form.learnedAfter} disabled={readOnly} onChange={(e) => patch("learnedAfter", e.target.value)} />
            </SectionCard>

            <SectionCard id="more" num={7} title="더 알고 싶은 점을 적으세요" marker="◆">
              <textarea className={TEXTAREA} rows={3} value={form.wantToKnowMore} disabled={readOnly} onChange={(e) => patch("wantToKnowMore", e.target.value)} />
            </SectionCard>

            <p className="text-center text-xs font-medium text-slate-500">성찰 및 정리</p>

            <SectionCard id="classLearned" num={8} title="이번 시간에 배운 내용을 적어보세요">
              <textarea className={TEXTAREA} rows={4} value={form.classLearned} disabled={readOnly} onChange={(e) => patch("classLearned", e.target.value)} />
            </SectionCard>

            <SectionCard id="mostCurious" num={9} title="이번 시간 탐구를 통해 가장 궁금했던 내용을 적으세요">
              <textarea className={TEXTAREA} rows={3} value={form.mostCurious} disabled={readOnly} onChange={(e) => patch("mostCurious", e.target.value)} />
            </SectionCard>

            <SectionCard id="organized" num={10} title="탐구 결과를 바탕으로 탐구 내용을 정리해봅시다">
              <textarea className={TEXTAREA} rows={4} value={form.resultOrganized} disabled={readOnly} onChange={(e) => patch("resultOrganized", e.target.value)} />
            </SectionCard>

            <SectionCard id="realLife" num={11} title="생활 속 이야기를 이번 탐구 활동과 관련하여 정리해봅시다">
              <textarea className={TEXTAREA} rows={4} value={form.realLifeStory} disabled={readOnly} onChange={(e) => patch("realLifeStory", e.target.value)} />
            </SectionCard>

            <SectionCard id="visual" num={12} title="그림으로 나타내어 봅시다">
              <DrawingCanvas
                value={form.visualDrawing}
                readOnly={readOnly}
                onChange={(dataUrl) => patch("visualDrawing", dataUrl)}
              />
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-slate-700">그림 설명 (선택)</p>
                <textarea
                  className={TEXTAREA}
                  rows={3}
                  placeholder="그린 그림에 대해 간단히 설명해도 됩니다."
                  value={form.visualDescription}
                  disabled={readOnly}
                  onChange={(e) => patch("visualDescription", e.target.value)}
                />
              </div>
            </SectionCard>

            {!submitted && (
              <div className="flex justify-center pt-4 print:hidden">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="rounded-xl bg-blue-600 px-10 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "제출 중..." : "제출하기"}
                </button>
              </div>
            )}

            {message && <p className="text-center text-sm text-green-600">{message}</p>}
            {error && <p className="whitespace-pre-line text-center text-sm text-red-600">{error}</p>}

            <PeerFeedbackSection
              targetType="inquiry-report"
              templateId="inquiry-report"
              templateName="탐구보고서"
              ownDocId={reportId}
              enabled={submitted && Boolean(reportId) && role === "student"}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionCard({
  id,
  num,
  title,
  subtitle,
  marker,
  children,
}: {
  id: string;
  num: number;
  title: string;
  subtitle?: string;
  marker?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`section-${id}`}
      data-section={id}
      className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:break-inside-avoid print:shadow-none"
    >
      <h2 className="mb-4 text-base font-bold text-slate-800">
        {marker ? (
          <span className="mr-2 text-blue-700">{marker}</span>
        ) : (
          <span className="mr-2 text-blue-800">{num}.</span>
        )}
        {title}
        {subtitle && <span className="ml-2 text-sm font-normal text-slate-500">({subtitle})</span>}
      </h2>
      {children}
    </section>
  );
}
