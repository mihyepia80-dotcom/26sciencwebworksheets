"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AiFeedbackCard } from "@/components/AiFeedbackCard";
import { AiFeaturePanel } from "@/components/AiFeaturePanel";
import { ShareButton } from "@/components/ShareButton";
import { PeerFeedbackSection } from "@/components/peer-feedback/PeerFeedbackSection";
import { WorksheetHeader } from "@/components/common/WorksheetHeader";
import { TemplateRenderer } from "@/components/templates";
import { GuidedQuestionsPanel } from "@/components/worksheet/GuidedQuestionsPanel";
import { TeacherGuidedQuestionsSidebar } from "@/components/student/TeacherGuidedQuestionsSidebar";
import { WorksheetProgressNav } from "@/components/student/WorksheetProgressNav";
import { WorksheetActionBar, WorksheetGuidanceBanner, WorksheetPrintBar } from "@/components/worksheet/WorksheetChrome";
import { useAuth } from "@/components/AuthProvider";
import type { AiRating } from "@/lib/ai/feedback";
import { useAiQuota } from "@/hooks/useAiQuota";
import { useGuidedQuestions } from "@/hooks/useGuidedQuestions";
import { useStudentTemplateProgress } from "@/hooks/useStudentTemplateProgress";
import { useWorksheetDraft } from "@/hooks/useWorksheetDraft";
import { useWorksheetLoader } from "@/hooks/useWorksheetLoader";
import { useWorksheetSubmit } from "@/hooks/useWorksheetSubmit";
import { getTemplateById } from "@/lib/templates/registry";
import { formatTemplateTitle, getGlobalSequenceNumber } from "@/lib/templates/curriculum";
import { DEFAULT_META, type Answers, type WorksheetMeta } from "@/lib/types";
import type { WorksheetSubmission } from "@/lib/firebase/submissions";
import { useWorksheetState } from "@/lib/useWorksheetState";
import { getMinFieldChars } from "@/lib/worksheet-validation";
import { canPersistStudentWork, isGuest, isLoggedInStudent, isWorksheetEditorMode } from "@/lib/auth/access";
import { GuestNotice } from "@/components/common/GuestNotice";
import { InquiryQuestionBotPanel } from "@/components/worksheet/InquiryQuestionBotPanel";
import { PadletPublishPanel } from "@/components/worksheet/PadletPublishPanel";
import type { SubmissionPadletPost } from "@/lib/padlet/publish-types";
import { getDissolutionWorksheetDefaults } from "@/lib/worksheet-content/build-schemas";
import { getDissolutionLesson } from "@/lib/worksheet-content/dissolution-lessons";

interface WorksheetViewerProps {
  templateId: string;
  embedded?: boolean;
  linkedReportId?: string;
  editSubmissionId?: string | null;
  onDraftSaved?: (submission: WorksheetSubmission) => void;
  onSubmitted?: (submission: WorksheetSubmission) => void;
}

export function WorksheetViewer({
  templateId,
  embedded = false,
  linkedReportId: linkedReportIdProp,
  editSubmissionId: editSubmissionIdProp,
  onDraftSaved,
  onSubmitted,
}: WorksheetViewerProps) {
  const searchParams = useSearchParams();
  const editSubmissionId = editSubmissionIdProp ?? searchParams.get("submission");
  const linkedReportId = linkedReportIdProp;
  const urlPeriod = searchParams.get("period")?.trim() || "";

  const { user, role, studentProfile } = useAuth();
  const template = getTemplateById(templateId);
  const isStudent = isLoggedInStudent(user, role);
  const guestMode = isGuest(user, role);
  const worksheetEditorMode = isWorksheetEditorMode(user, role);
  const canPersist = canPersistStudentWork(user, role);

  const [meta, setMeta] = useState<WorksheetMeta>(() => ({
    ...DEFAULT_META,
    grade: studentProfile?.grade ?? "",
    classNo: studentProfile?.classNo ?? "",
    studentNo: studentProfile?.studentNo ?? "",
    studentName: studentProfile?.studentName ?? "",
  }));
  const { values, onChange, setAll } = useWorksheetState();
  const [submissionId, setSubmissionId] = useState<string | null>(editSubmissionId);
  const [submitted, setSubmitted] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");
  const [aiRating, setAiRating] = useState<AiRating | null>(null);
  const [linkedInstanceNo, setLinkedInstanceNo] = useState<number | undefined>();
  const [padletPost, setPadletPost] = useState<SubmissionPadletPost | undefined>();
  const [inquiryBotConfirmed, setInquiryBotConfirmed] = useState(false);

  const { aiQuota, setAiQuota } = useAiQuota(user?.uid, isStudent);
  const { getProgress, loading: progressLoading } = useStudentTemplateProgress(isStudent);

  const handleTeacherMetaPrefill = useCallback((patch: Partial<WorksheetMeta>) => {
    setMeta((prev) => ({ ...prev, ...patch }));
  }, []);

  const guided = useGuidedQuestions({
    templateId,
    templateName: template?.name ?? "",
    meta,
    values,
    onChange,
    onMetaPrefill: handleTeacherMetaPrefill,
    readOnly: submitted,
    studentMode: isStudent,
    skipTeacherPrefill: Boolean(editSubmissionId),
    userUid: user?.uid,
  });

  const handleLoaded = useCallback(
    (data: {
      submissionId: string;
      meta: WorksheetMeta;
      values: Record<string, string>;
      aiFeedback: string;
      aiRating: AiRating | null;
      status: "draft" | "submitted";
      linkedReportId?: string;
      instanceNo?: number;
      padletPost?: SubmissionPadletPost;
    }) => {
      setSubmissionId(data.submissionId);
      setMeta(data.meta);
      setAll(data.values);
      setAiFeedback(data.aiFeedback);
      setAiRating(data.aiRating);
      const isSubmitted = data.status === "submitted";
      setSubmitted(isSubmitted);
      setIsDraft(!isSubmitted);
      setLinkedInstanceNo(data.instanceNo);
      setPadletPost(data.padletPost);
    },
    [setAll],
  );

  const { loading, loadError } = useWorksheetLoader({
    editSubmissionId,
    templateId,
    studentUid: user?.uid,
    linkedReportId,
    enabled: worksheetEditorMode && Boolean(user?.uid),
    onLoaded: handleLoaded,
  });

  const activePeriod = meta.period?.trim() || urlPeriod || undefined;
  const inquiryReady =
    !template?.questionBot ||
    Boolean(meta.inquiryQuestion?.trim()) ||
    inquiryBotConfirmed ||
    submitted;

  useEffect(() => {
    if (meta.inquiryQuestion?.trim()) setInquiryBotConfirmed(true);
  }, [meta.inquiryQuestion]);

  useEffect(() => {
    if (editSubmissionId || !urlPeriod) return;
    const lesson = getDissolutionLesson(urlPeriod);
    if (!lesson || lesson.templateId !== templateId) return;
    const defaults = getDissolutionWorksheetDefaults(urlPeriod);
    setMeta((prev) => ({
      ...prev,
      period: urlPeriod,
      unit: prev.unit?.trim() ? prev.unit : defaults.unit ?? "",
      topic: prev.topic?.trim() ? prev.topic : defaults.topic ?? "",
      inquiryQuestion: prev.inquiryQuestion?.trim() ? prev.inquiryQuestion : defaults.inquiryQuestion ?? "",
      writingContext: prev.writingContext?.trim() ? prev.writingContext : defaults.writingGuide ?? "",
    }));
  }, [editSubmissionId, urlPeriod, templateId]);

  const buildSavePayload = useCallback(() => {
    if (!user || !template) return null;
    return {
      templateId,
      templateName: template.name,
      meta,
      values,
      studentUid: user.uid,
      ...(linkedReportId ? { linkedReportId, instanceNo: linkedInstanceNo } : {}),
    };
  }, [linkedInstanceNo, linkedReportId, meta, template, templateId, user, values]);

  const notifyParent = useCallback(
    (id: string, status: "draft" | "submitted") => {
      if (!user || !template) return;
      const submission: WorksheetSubmission = {
        id,
        templateId,
        templateName: template.name,
        meta,
        values,
        studentUid: user.uid,
        status,
        submittedAt: null,
        updatedAt: null,
        linkedReportId,
        instanceNo: linkedInstanceNo,
        aiFeedback: aiFeedback || undefined,
        aiRating: aiRating ?? undefined,
      };
      if (status === "draft") onDraftSaved?.(submission);
      else onSubmitted?.(submission);
    },
    [aiFeedback, aiRating, linkedInstanceNo, linkedReportId, meta, onDraftSaved, onSubmitted, template, templateId, user, values],
  );

  const handleSubmitSuccess = useCallback(
    (result: { submissionId: string; aiFeedback: string; aiRating: AiRating | null }) => {
      setSubmissionId(result.submissionId);
      if (result.aiFeedback) setAiFeedback(result.aiFeedback);
      if (result.aiRating) setAiRating(result.aiRating);
      setSubmitted(true);
      setIsDraft(false);
      notifyParent(result.submissionId, "submitted");
    },
    [notifyParent],
  );

  const handleDraftSuccess = useCallback(
    (result: { submissionId: string }) => {
      setSubmissionId(result.submissionId);
      setIsDraft(true);
      setSubmitted(false);
      notifyParent(result.submissionId, "draft");
    },
    [notifyParent],
  );

  const { savingDraft, draftMessage, draftError, saveDraft, clearDraftFeedback } = useWorksheetDraft({
    onSuccess: handleDraftSuccess,
  });

  const { submitting, submitError, submit, clearError, setSubmitError } = useWorksheetSubmit({
    aiQuota,
    setAiQuota,
    onSuccess: handleSubmitSuccess,
  });

  useEffect(() => {
    if (editSubmissionId || !studentProfile) return;
    setMeta((prev) => ({
      ...prev,
      grade: studentProfile.grade || prev.grade,
      classNo: studentProfile.classNo || prev.classNo,
      studentNo: studentProfile.studentNo || prev.studentNo,
      studentName: studentProfile.studentName || prev.studentName,
    }));
  }, [editSubmissionId, studentProfile]);

  useEffect(() => {
    setSubmissionId(editSubmissionId);
  }, [editSubmissionId]);

  if (!template) return null;

  const onMetaChange = (key: keyof WorksheetMeta, value: string) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const handleDraftSave = () => {
    if (!canPersist) {
      setSubmitError(
        guestMode
          ? "로그인 후 임시 저장할 수 있습니다. 로그인 없이 작성한 내용은 저장되지 않습니다."
          : "로그인 후 임시 저장할 수 있습니다.",
      );
      return;
    }
    const payload = buildSavePayload();
    if (!payload) return;
    clearDraftFeedback();
    clearError();
    void saveDraft(payload, submissionId, submitted);
  };

  const handleSubmit = () => {
    if (!canPersist) {
      setSubmitError(
        guestMode
          ? "로그인 후 제출할 수 있습니다. 로그인 없이 작성한 내용은 저장되지 않습니다."
          : "로그인 후 제출할 수 있습니다.",
      );
      return;
    }
    const payload = buildSavePayload();
    if (!payload) return;
    submit(payload, submissionId, aiFeedback, aiRating);
  };

  const handleEdit = () => {
    setSubmitted(false);
    clearError();
    clearDraftFeedback();
  };

  if (loading && !embedded) {
    return (
      <div className={`text-center text-base text-slate-500 ${embedded ? "py-10" : "mx-auto max-w-5xl px-5 py-20"}`}>
        활동지 불러오는 중...
      </div>
    );
  }

  return (
    <div
      data-worksheet-embedded={embedded ? "true" : undefined}
      className={`print:max-w-none print:space-y-0 print:p-0 ${embedded ? "worksheet-embedded-shell space-y-3" : `mx-auto space-y-4 px-4 py-6 ${worksheetEditorMode ? "max-w-7xl" : "max-w-5xl"}`}`}
    >
      {embedded && loading && (
        <p className="print:hidden rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">활동지 불러오는 중...</p>
      )}
      {guestMode && !embedded && (
        <div className="print:hidden">
          <GuestNotice />
        </div>
      )}
      {!embedded && (
        <div className="flex items-center justify-between print:hidden">
          <Link href="/" className="ui-link">
            ← 홈
          </Link>
          <span className="ui-chip bg-slate-100 text-slate-600">
            순번 {getGlobalSequenceNumber(template)}
          </span>
        </div>
      )}

      {!embedded && (
        <div className="print:hidden">
          <WorksheetGuidanceBanner templateId={template.id} aiQuota={aiQuota} studentMode={isStudent} />
        </div>
      )}

      {embedded && worksheetEditorMode && (
        <p className="print:hidden rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-2.5 text-sm leading-relaxed text-blue-900">
          {canPersist ? (
            <>
              본문 칸은 <strong>{getMinFieldChars(template.id)}자 이상</strong> 한글로 작성하세요. 임시 저장 후 제출할 수 있습니다.
            </>
          ) : (
            <>로그인 없이 체험 중입니다. 작성 내용은 저장되지 않습니다.</>
          )}
        </p>
      )}

      {loadError && <p className="text-sm text-red-600 print:hidden">{loadError}</p>}

      {isStudent && !embedded && (
        <div className="print:hidden lg:hidden">
          <WorksheetProgressNav
            variant="tabs"
            currentTemplateId={templateId}
            getProgress={getProgress}
            loading={progressLoading}
          />
        </div>
      )}

      <div className={isStudent && !embedded ? "grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]" : ""}>
        {isStudent && !embedded && (
          <div className="hidden print:hidden lg:block">
            <WorksheetProgressNav
              variant="sidebar"
              currentTemplateId={templateId}
              getProgress={getProgress}
              loading={progressLoading}
            />
          </div>
        )}

        <div className="min-w-0 space-y-4">
      <div id="worksheet-print" className="worksheet-print-area space-y-4">
        <WorksheetHeader
          toolName={formatTemplateTitle(template)}
          meta={meta}
          onMetaChange={onMetaChange}
          readOnly={submitted}
        />

        {template.questionBot && (
          <InquiryQuestionBotPanel
            templateId={templateId}
            meta={meta}
            values={values}
            onChange={onChange}
            onMetaChange={onMetaChange}
            readOnly={submitted}
            studentUid={user?.uid}
            period={activePeriod}
            isGuest={guestMode || !canPersist}
            onConfirmedChange={setInquiryBotConfirmed}
          />
        )}

        {template.questionBot && inquiryReady && (
          <div className="print:hidden flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
              2
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">사고 활동지 작성</p>
              <p className="text-xs text-slate-600">
                {meta.inquiryQuestion?.trim()
                  ? `탐구 질문: ${meta.inquiryQuestion.trim()}`
                  : "탐구 질문을 바탕으로 사고도구 활동을 이어갑니다."}
              </p>
            </div>
          </div>
        )}

        {template.questionBot && !inquiryReady && !submitted && (
          <div className="print:hidden rounded-xl border border-dashed border-violet-200 bg-violet-50/50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-violet-900">위 챗봇에서 탐구 질문을 먼저 만들어 주세요.</p>
            <p className="mt-1 text-xs text-violet-700">질문을 확정하면 사고 활동지가 열립니다.</p>
          </div>
        )}

        {!isStudent && role === "teacher" && template.aiFeature && inquiryReady && (
          <div className="print:hidden">
            <AiFeaturePanel template={template} />
          </div>
        )}

        {!isStudent && role === "teacher" && guided.visible && inquiryReady && (
          <div className="print:hidden">
            <GuidedQuestionsPanel
              topic={meta.topic}
              questions={guided.questions}
              source={guided.source}
              loading={guided.loading}
              error={guided.error}
              readOnly={submitted}
              studentView={guided.studentMode}
              onQuestionChange={guided.updateQuestion}
              onRegenerate={guided.studentMode ? undefined : guided.regenerate}
            />
          </div>
        )}

        {inquiryReady && (
          <>
        {worksheetEditorMode ? (
          embedded || guestMode ? (
            <TemplateRenderer templateId={templateId} period={activePeriod} values={values} onChange={onChange} readOnly={submitted} />
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0">
                <TemplateRenderer templateId={templateId} period={activePeriod} values={values} onChange={onChange} readOnly={submitted} />
              </div>
              {guided.visible && (
                <div className="lg:sticky lg:top-4 lg:self-start print:hidden">
                  <TeacherGuidedQuestionsSidebar
                    meta={meta}
                    questions={guided.teacherReferenceQuestions}
                    loading={guided.loading}
                    error={guided.error}
                    hasTeacherGuide={guided.source === "pinned" && guided.teacherReferenceQuestions.some((q) => q.trim())}
                  />
                </div>
              )}
            </div>
          )
        ) : (
          <TemplateRenderer templateId={templateId} period={activePeriod} values={values} onChange={onChange} readOnly={submitted} />
        )}

        <WorksheetPrintBar
          onBeforePrint={() => {
            if (isStudent && user && !submitted && !savingDraft) {
              handleDraftSave();
            }
          }}
        />
          </>
        )}
      </div>

      {submitted && aiRating && aiFeedback && (
        <div className="print:hidden">
          <AiFeedbackCard rating={aiRating} feedback={aiFeedback} />
        </div>
      )}

      {submitted && submissionId && user && isStudent && (
        <div className="print:hidden">
          <PadletPublishPanel
            submissionId={submissionId}
            submitted={submitted}
            templateId={templateId}
            templateName={template.name}
            meta={meta}
            values={values}
            padletPost={padletPost}
            isGuest={guestMode || !canPersist}
            onPadletPostChange={setPadletPost}
          />
        </div>
      )}

      {submitted && submissionId && user && (
        <div className="print:hidden">
          <ShareButton
          submission={{
            id: submissionId,
            templateId,
            templateName: template.name,
            meta,
            values,
            studentUid: user.uid,
            status: "submitted",
            submittedAt: null,
            updatedAt: null,
            aiFeedback: aiFeedback || undefined,
            aiRating: aiRating ?? undefined,
          }}
          studentUid={user.uid}
        />
        </div>
      )}

      <div className="print:hidden">
        <WorksheetActionBar
        submitted={submitted}
        submitting={submitting}
        savingDraft={savingDraft}
        hasSubmissionId={Boolean(submissionId)}
        aiAvailable={aiQuota?.available !== false}
        onEdit={handleEdit}
        onDraftSave={handleDraftSave}
        onSubmit={handleSubmit}
        persistEnabled={canPersist}
        />
      </div>

      {(submitError || draftError) && (
        <p className="whitespace-pre-line text-center text-sm text-red-600 print:hidden">{submitError || draftError}</p>
      )}

      {draftMessage && !submitted && (
        <p className="text-center text-sm text-amber-700 print:hidden">{draftMessage}</p>
      )}

      {isDraft && !submitted && !draftMessage && submissionId && (
        <p className="text-center text-sm text-amber-700 print:hidden">임시 저장된 활동지입니다. 이어서 작성한 뒤 제출하세요.</p>
      )}

      {submitted && (
        <p className="text-center text-sm text-green-600 print:hidden">
          제출 완료! {aiRating ? "AI 피드백을 확인하고 " : ""}공유 링크로 활동지를 보여줄 수 있습니다.
        </p>
      )}

      {!canPersist && !submitted && role === "teacher" && (
        <p className="text-center text-sm text-amber-700 print:hidden">로그인 후 제출할 수 있습니다.</p>
      )}

      {guestMode && !submitted && (
        <p className="text-center text-sm text-amber-800 print:hidden">
          체험 모드입니다. PDF 출력은 가능하지만 저장·제출은{" "}
          <Link href="/login" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
            로그인
          </Link>
          후 이용할 수 있습니다.
        </p>
      )}

      <div className="print:hidden">
        <PeerFeedbackSection
          targetType="worksheet"
          templateId={templateId}
          templateName={template.name}
          ownDocId={submissionId}
          enabled={submitted && Boolean(submissionId) && isStudent}
        />
      </div>
        </div>
      </div>
    </div>
  );
}
