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
import { WorksheetActionBar, WorksheetGuidanceBanner, WorksheetPrintBar } from "@/components/worksheet/WorksheetChrome";
import { useAuth } from "@/components/AuthProvider";
import type { AiRating } from "@/lib/ai/feedback";
import { useAiQuota } from "@/hooks/useAiQuota";
import { useGuidedQuestions } from "@/hooks/useGuidedQuestions";
import { useWorksheetDraft } from "@/hooks/useWorksheetDraft";
import { useWorksheetLoader } from "@/hooks/useWorksheetLoader";
import { useWorksheetSubmit } from "@/hooks/useWorksheetSubmit";
import { getTemplateById } from "@/lib/templates/registry";
import { formatTemplateTitle, getGlobalSequenceNumber } from "@/lib/templates/curriculum";
import { DEFAULT_META, type WorksheetMeta } from "@/lib/types";
import { useWorksheetState } from "@/lib/useWorksheetState";

interface WorksheetViewerProps {
  templateId: string;
}

export function WorksheetViewer({ templateId }: WorksheetViewerProps) {
  const searchParams = useSearchParams();
  const editSubmissionId = searchParams.get("submission");

  const { user, role, studentProfile } = useAuth();
  const template = getTemplateById(templateId);
  const isStudent = role === "student";

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

  const { aiQuota, setAiQuota } = useAiQuota(user?.uid, isStudent);

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
    }) => {
      setSubmissionId(data.submissionId);
      setMeta(data.meta);
      setAll(data.values);
      setAiFeedback(data.aiFeedback);
      setAiRating(data.aiRating);
      const isSubmitted = data.status === "submitted";
      setSubmitted(isSubmitted);
      setIsDraft(!isSubmitted);
    },
    [setAll],
  );

  const { loading, loadError } = useWorksheetLoader({
    editSubmissionId,
    templateId,
    studentUid: user?.uid,
    enabled: isStudent,
    onLoaded: handleLoaded,
  });

  const handleSubmitSuccess = useCallback(
    (result: { submissionId: string; aiFeedback: string; aiRating: AiRating | null }) => {
      setSubmissionId(result.submissionId);
      if (result.aiFeedback) setAiFeedback(result.aiFeedback);
      if (result.aiRating) setAiRating(result.aiRating);
      setSubmitted(true);
      setIsDraft(false);
    },
    [],
  );

  const handleDraftSuccess = useCallback((result: { submissionId: string }) => {
    setSubmissionId(result.submissionId);
    setIsDraft(true);
    setSubmitted(false);
  }, []);

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

  if (!template) return null;

  const onMetaChange = (key: keyof WorksheetMeta, value: string) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const handleDraftSave = () => {
    if (!user || !isStudent) {
      setSubmitError("학생 로그인 후 임시 저장할 수 있습니다.");
      return;
    }
    clearDraftFeedback();
    clearError();
    void saveDraft(
      {
        templateId,
        templateName: template.name,
        meta,
        values,
        studentUid: user.uid,
      },
      submissionId,
      submitted,
    );
  };

  const handleSubmit = () => {
    if (!user || !isStudent) {
      setSubmitError("학생 로그인 후 제출할 수 있습니다.");
      return;
    }
    submit(
      {
        templateId,
        templateName: template.name,
        meta,
        values,
        studentUid: user.uid,
      },
      submissionId,
      aiFeedback,
      aiRating,
    );
  };

  const handleEdit = () => {
    setSubmitted(false);
    clearError();
    clearDraftFeedback();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-slate-500">
        활동지 불러오는 중...
      </div>
    );
  }

  return (
    <div className={`mx-auto space-y-4 px-4 py-6 print:max-w-none print:space-y-0 print:p-0 ${isStudent ? "max-w-7xl" : "max-w-5xl"}`}>
      <div className="flex items-center justify-between print:hidden">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← 템플릿 목록
        </Link>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          순번 {getGlobalSequenceNumber(template)}
        </span>
      </div>

      <div className="print:hidden">
        <WorksheetGuidanceBanner templateId={template.id} aiQuota={aiQuota} studentMode={isStudent} />
      </div>

      {loadError && <p className="text-sm text-red-600 print:hidden">{loadError}</p>}

      <div id="worksheet-print" className="worksheet-print-area space-y-4">
        <WorksheetHeader
          toolName={formatTemplateTitle(template)}
          meta={meta}
          onMetaChange={onMetaChange}
          readOnly={submitted}
        />

        {!isStudent && template.aiFeature && (
          <div className="print:hidden">
            <AiFeaturePanel template={template} />
          </div>
        )}

        {!isStudent && guided.visible && (
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

        {isStudent ? (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <TemplateRenderer templateId={templateId} values={values} onChange={onChange} readOnly={submitted} />
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
        ) : (
          <TemplateRenderer templateId={templateId} values={values} onChange={onChange} readOnly={submitted} />
        )}

        <WorksheetPrintBar
          onBeforePrint={() => {
            if (isStudent && user && !submitted && !savingDraft) {
              handleDraftSave();
            }
          }}
        />
      </div>

      {submitted && aiRating && aiFeedback && (
        <div className="print:hidden">
          <AiFeedbackCard rating={aiRating} feedback={aiFeedback} />
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

      {!isStudent && !submitted && (
        <p className="text-center text-sm text-amber-700 print:hidden">학생 로그인 후 제출할 수 있습니다.</p>
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
  );
}
