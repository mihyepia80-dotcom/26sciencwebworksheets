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
import { WorksheetActionBar, WorksheetGuidanceBanner } from "@/components/worksheet/WorksheetChrome";
import { useAuth } from "@/components/AuthProvider";
import type { AiRating } from "@/lib/ai/feedback";
import { useAiQuota } from "@/hooks/useAiQuota";
import { useGuidedQuestions } from "@/hooks/useGuidedQuestions";
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
    }) => {
      setSubmissionId(data.submissionId);
      setMeta(data.meta);
      setAll(data.values);
      setAiFeedback(data.aiFeedback);
      setAiRating(data.aiRating);
      setSubmitted(true);
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
    },
    [],
  );

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
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-slate-500">
        활동지 불러오는 중...
      </div>
    );
  }

  return (
    <div className={`mx-auto space-y-4 px-4 py-6 ${isStudent ? "max-w-7xl" : "max-w-5xl"}`}>
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← 템플릿 목록
        </Link>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          순번 {getGlobalSequenceNumber(template)}
        </span>
      </div>

      <WorksheetGuidanceBanner templateId={template.id} aiQuota={aiQuota} studentMode={isStudent} />

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      <WorksheetHeader
        toolName={formatTemplateTitle(template)}
        meta={meta}
        onMetaChange={onMetaChange}
        readOnly={submitted}
      />

      {!isStudent && template.aiFeature && <AiFeaturePanel template={template} />}

      {!isStudent && guided.visible && (
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
      )}

      {isStudent ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <TemplateRenderer templateId={templateId} values={values} onChange={onChange} readOnly={submitted} />
          </div>
          {guided.visible && (
            <div className="lg:sticky lg:top-4 lg:self-start">
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

      {submitted && aiRating && aiFeedback && (
        <AiFeedbackCard rating={aiRating} feedback={aiFeedback} />
      )}

      {submitted && submissionId && user && (
        <ShareButton
          submission={{
            id: submissionId,
            templateId,
            templateName: template.name,
            meta,
            values,
            studentUid: user.uid,
            submittedAt: null,
            aiFeedback: aiFeedback || undefined,
            aiRating: aiRating ?? undefined,
          }}
          studentUid={user.uid}
        />
      )}

      <WorksheetActionBar
        submitted={submitted}
        submitting={submitting}
        hasSubmissionId={Boolean(submissionId)}
        aiAvailable={aiQuota?.available !== false}
        onEdit={handleEdit}
        onSubmit={handleSubmit}
      />

      {submitError && (
        <p className="whitespace-pre-line text-center text-sm text-red-600">{submitError}</p>
      )}

      {submitted && (
        <p className="text-center text-sm text-green-600">
          제출 완료! {aiRating ? "AI 피드백을 확인하고 " : ""}공유 링크로 활동지를 보여줄 수 있습니다.
        </p>
      )}

      {!isStudent && !submitted && (
        <p className="text-center text-sm text-amber-700">학생 로그인 후 제출할 수 있습니다.</p>
      )}

      <PeerFeedbackSection
        targetType="worksheet"
        templateId={templateId}
        templateName={template.name}
        ownDocId={submissionId}
        enabled={submitted && Boolean(submissionId) && isStudent}
      />
    </div>
  );
}
