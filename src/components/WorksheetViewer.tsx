"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AiFeedbackCard } from "@/components/AiFeedbackCard";
import { ShareButton } from "@/components/ShareButton";
import { PeerFeedbackSection } from "@/components/peer-feedback/PeerFeedbackSection";
import { WorksheetHeader } from "@/components/common/WorksheetHeader";
import { TemplateRenderer } from "@/components/templates";
import { useAuth } from "@/components/AuthProvider";
import type { AiRating } from "@/lib/ai/feedback";
import { fetchAiQuotaStatus, requestAiFeedback, type AiQuotaStatus } from "@/lib/ai/feedback";
import {
  getSubmission,
  isFirebaseConfigured,
  saveSubmission,
  updateSubmission,
  getFirebaseErrorMessage,
} from "@/lib/firebase";
import { getTemplateById } from "@/lib/templates/registry";
import { MIN_FIELD_CHARS, validateWorksheetValues } from "@/lib/worksheet-validation";
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
  const [meta, setMeta] = useState<WorksheetMeta>(() => ({
    ...DEFAULT_META,
    grade: studentProfile?.grade ?? "",
    classNo: studentProfile?.classNo ?? "",
    studentNo: studentProfile?.studentNo ?? "",
    studentName: studentProfile?.studentName ?? "",
  }));
  const { values, onChange, setAll } = useWorksheetState();
  const [submissionId, setSubmissionId] = useState<string | null>(editSubmissionId);
  const [loadingSubmission, setLoadingSubmission] = useState(Boolean(editSubmissionId));
  const [loadError, setLoadError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [aiRating, setAiRating] = useState<AiRating | null>(null);
  const [aiQuota, setAiQuota] = useState<AiQuotaStatus | null>(null);

  useEffect(() => {
    if (!user || role !== "student") return;
    fetchAiQuotaStatus(user.uid).then(setAiQuota).catch(() => {
      setAiQuota({
        available: false,
        studentUsed: 1,
        studentLimit: 1,
        studentRemaining: 0,
        globalUsed: 100,
        globalLimit: 100,
        globalRemaining: 0,
        reason: "student",
      });
    });
  }, [user, role]);

  useEffect(() => {
    if (!editSubmissionId || !user || role !== "student") {
      setLoadingSubmission(false);
      return;
    }

    let cancelled = false;
    setLoadingSubmission(true);
    setLoadError("");

    getSubmission(editSubmissionId)
      .then((submission) => {
        if (cancelled) return;
        if (!submission || submission.studentUid !== user.uid || submission.templateId !== templateId) {
          setLoadError("활동지를 불러올 수 없습니다.");
          return;
        }
        setSubmissionId(submission.id ?? editSubmissionId);
        setMeta(submission.meta);
        setAll(submission.values);
        setAiFeedback(submission.aiFeedback ?? "");
        setAiRating(submission.aiRating ?? null);
        setSubmitted(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError("활동지를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSubmission(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editSubmissionId, user, role, templateId, setAll]);

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

  const handleSubmit = async () => {
    if (!isFirebaseConfigured()) {
      setSubmitError("Firebase 설정이 없습니다. .env 파일을 확인하세요.");
      return;
    }

    if (!user || role !== "student") {
      setSubmitError("학생 로그인 후 제출할 수 있습니다.");
      return;
    }

    const validation = validateWorksheetValues(templateId, values);
    if (!validation.ok) {
      setSubmitError(validation.errors.slice(0, 5).join("\n"));
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    const payload = {
      templateId,
      templateName: template.name,
      meta,
      values,
      studentUid: user.uid,
    };

    try {
      let feedback = aiFeedback;
      let rating = aiRating;

      if (aiQuota?.available !== false) {
        try {
          const ai = await requestAiFeedback({
            studentUid: user.uid,
            templateName: template.name,
            meta,
            values,
          });
          feedback = ai.feedback;
          rating = ai.rating;
          setAiQuota(await fetchAiQuotaStatus(user.uid));
        } catch (error: unknown) {
          if (error instanceof Error && error.message === "QUOTA_EXCEEDED") {
            setAiQuota(await fetchAiQuotaStatus(user.uid));
          } else {
            throw error;
          }
        }
      }

      const savePayload = {
        ...payload,
        ...(feedback && rating ? { aiFeedback: feedback, aiRating: rating } : {}),
      };

      if (submissionId) {
        await updateSubmission(submissionId, savePayload);
      } else {
        const id = await saveSubmission(savePayload);
        setSubmissionId(id);
      }

      if (feedback) setAiFeedback(feedback);
      if (rating) setAiRating(rating);
      setSubmitted(true);
    } catch (error: unknown) {
      setSubmitError(getFirebaseErrorMessage(error, "제출에 실패했습니다. 다시 시도해 주세요."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setSubmitted(false);
    setSubmitError("");
  };

  if (loadingSubmission) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-slate-500">
        활동지 불러오는 중...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← 템플릿 목록
        </Link>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          #{template.order}
        </span>
      </div>

      <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-800">
        각 항목을 <strong>{MIN_FIELD_CHARS}자 이상 한글</strong>로 작성한 뒤 제출하세요.
        {aiQuota?.available === false ? (
          <span className="mt-1 block text-amber-700">
            {aiQuota.reason === "student"
              ? "오늘 AI 피드백은 학생 1인당 1회만 이용할 수 있습니다. 제출은 가능하지만 AI 피드백은 제공되지 않습니다."
              : `오늘 AI 무료 사용량(전체 ${aiQuota.globalLimit}회)을 모두 사용했습니다. 제출은 가능하지만 AI 피드백은 제공되지 않습니다.`}
          </span>
        ) : aiQuota ? (
          <span className="mt-1 block text-slate-600">
            AI 피드백: 오늘 내 남은 횟수 {aiQuota.studentRemaining}/{aiQuota.studentLimit}
            (전체 {aiQuota.globalRemaining}/{aiQuota.globalLimit})
          </span>
        ) : null}
      </p>

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      <WorksheetHeader
        toolName={template.name}
        meta={meta}
        onMetaChange={onMetaChange}
        extraFields={template.headerFields}
        readOnly={submitted}
      />

      <TemplateRenderer templateId={templateId} values={values} onChange={onChange} readOnly={submitted} />

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

      <div className="flex flex-wrap justify-end gap-3 pt-4">
        {submitted && (
          <Link
            href="/my"
            className="rounded-lg border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
          >
            내 활동지 보기
          </Link>
        )}
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          onClick={handleEdit}
          disabled={submitting || !submitted}
        >
          다시 수정
        </button>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          onClick={handleSubmit}
          disabled={submitting || submitted}
        >
          {submitting
            ? aiQuota?.available === false
              ? "제출 중..."
              : "AI 피드백 생성 중..."
            : submissionId
              ? "다시 제출"
              : "제출하기"}
        </button>
      </div>

      {submitError && (
        <p className="whitespace-pre-line text-center text-sm text-red-600">{submitError}</p>
      )}

      {submitted && (
        <p className="text-center text-sm text-green-600">
          제출 완료! {aiRating ? "AI 피드백을 확인하고 " : ""}공유 링크로 활동지를 보여줄 수 있습니다.
        </p>
      )}

      <PeerFeedbackSection
        targetType="worksheet"
        templateId={templateId}
        templateName={template.name}
        ownDocId={submissionId}
        enabled={submitted && Boolean(submissionId) && role === "student"}
      />
    </div>
  );
}
