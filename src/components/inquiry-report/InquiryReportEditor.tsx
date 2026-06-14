"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  createInquiryReportDraft,
  getInquiryReport,
  updateInquiryReport,
} from "@/lib/firebase/inquiry-reports";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import {
  EMPTY_INQUIRY_REPORT,
  INQUIRY_SECTIONS,
  validateInquiryReport,
  type InquiryReportForm,
} from "@/lib/inquiry-report/types";

type ViewMode = "write" | "preview";
type ZoomLevel = 100 | 125 | 150;

const TOOL_BUTTON =
  "flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-100";

export function InquiryReportEditor({ initialReportId }: { initialReportId?: string | null }) {
  const { user, role } = useAuth();
  const [form, setForm] = useState<InquiryReportForm>(EMPTY_INQUIRY_REPORT);
  const [reportId, setReportId] = useState<string | null>(initialReportId ?? null);
  const [mode, setMode] = useState<ViewMode>("write");
  const [zoom, setZoom] = useState<ZoomLevel>(100);
  const [activeSection, setActiveSection] = useState("title");
  const [loading, setLoading] = useState(Boolean(initialReportId));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
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
          title: doc.title,
          materials: doc.materials,
          content: doc.content,
          processSummary: doc.processSummary,
          sceneDescription: doc.sceneDescription,
          resultSummary: doc.resultSummary,
          conclusion: doc.conclusion,
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
          setActiveSection(visible[0].target.getAttribute("data-section") ?? "title");
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
    const id = await createInquiryReportDraft(form, user.uid);
    setReportId(id);
    return id;
  }, [form, reportId, user]);

  const patch = <K extends keyof InquiryReportForm>(key: K, value: InquiryReportForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      const id = await ensureReportId();
      await updateInquiryReport(id, form, user.uid, submitted ? "submitted" : "draft");
      setMessage("저장되었습니다.");
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "저장에 실패했습니다."));
    } finally {
      setSaving(false);
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
      const id = await ensureReportId();
      await updateInquiryReport(id, form, user.uid, "submitted");
      setSubmitted(true);
      setMode("preview");
      setMessage("제출이 완료되었습니다!");
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
    <div className="flex min-h-screen flex-col bg-slate-100 print:bg-white">
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
              <span className="text-base">✏️</span>
              쓰기
            </button>
            <button
              type="button"
              className={`${TOOL_BUTTON} ${mode === "preview" ? "bg-blue-50 text-blue-700" : ""}`}
              onClick={() => setMode("preview")}
            >
              <span className="text-base">👁</span>
              미리보기
            </button>
            <button type="button" className={TOOL_BUTTON} onClick={cycleZoom}>
              <span className="text-base">🔍</span>
              화면확대 ({zoom}%)
            </button>
            <button type="button" className={TOOL_BUTTON} onClick={() => window.print()}>
              <span className="text-base">🖨</span>
              출력
            </button>
            <button
              type="button"
              className={TOOL_BUTTON}
              onClick={handleSave}
              disabled={saving || submitted}
            >
              <span className="text-base">💾</span>
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
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
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 py-6 print:overflow-visible"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          <div className="mx-auto max-w-3xl space-y-5 pb-24">
            {/* 모둠 정보 */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:shadow-none">
              <div className="flex flex-wrap items-center gap-3 text-sm">
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

            {/* 1. 제목 */}
            <SectionCard id="title" num={1} title="제목" subtitle="">
              <textarea
                className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
                rows={3}
                placeholder="실험 제목과 목적을 입력하세요..."
                value={form.title}
                disabled={readOnly}
                onChange={(e) => patch("title", e.target.value)}
              />
            </SectionCard>

            {/* 2. 준비물 */}
            <SectionCard id="materials" num={2} title="준비물">
              <textarea
                className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
                rows={4}
                placeholder="사용한 재료와 장비를 목록으로 입력하세요..."
                value={form.materials}
                disabled={readOnly}
                onChange={(e) => patch("materials", e.target.value)}
              />
            </SectionCard>

            {/* 3. 내용 */}
            <SectionCard id="content" num={3} title="내용" subtitle="설계 / 과정 / 방법 등">
              <textarea
                className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
                rows={6}
                placeholder="실험 내용을 입력하세요..."
                value={form.content}
                disabled={readOnly}
                onChange={(e) => patch("content", e.target.value)}
              />
            </SectionCard>

            {/* 4. 실험 과정 정리 */}
            <SectionCard id="process" num={4} title="실험 과정 정리">
              <textarea
                className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
                rows={5}
                placeholder="실험 과정을 순서대로 정리하세요..."
                value={form.processSummary}
                disabled={readOnly}
                onChange={(e) => patch("processSummary", e.target.value)}
              />
            </SectionCard>

            {/* 5. 실험 모습 */}
            <SectionCard id="scene" num={5} title="실험 모습">
              <textarea
                className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
                rows={5}
                placeholder="실험하는 모습을 글로 설명하세요..."
                value={form.sceneDescription}
                disabled={readOnly}
                onChange={(e) => patch("sceneDescription", e.target.value)}
              />
            </SectionCard>

            {/* 6. 실험 결과 */}
            <SectionCard id="result" num={6} title="실험 결과">
              <textarea
                className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
                rows={5}
                placeholder="실험 결과를 정리하세요..."
                value={form.resultSummary}
                disabled={readOnly}
                onChange={(e) => patch("resultSummary", e.target.value)}
              />
            </SectionCard>

            {/* 7. 알게 된 사실 및 결론 */}
            <SectionCard id="conclusion" num={7} title="알게 된 사실 및 결론">
              <textarea
                className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-400 focus:outline-none"
                rows={6}
                placeholder="알게 된 사실과 결론을 입력하세요..."
                value={form.conclusion}
                disabled={readOnly}
                onChange={(e) => patch("conclusion", e.target.value)}
              />
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
  children,
}: {
  id: string;
  num: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`section-${id}`}
      data-section={id}
      className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:break-inside-avoid print:shadow-none"
    >
      <h2 className="mb-4 text-base font-bold text-slate-800">
        <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm text-blue-800">
          {num}
        </span>
        {title}
        {subtitle && <span className="ml-2 text-sm font-normal text-slate-500">({subtitle})</span>}
      </h2>
      {children}
    </section>
  );
}
