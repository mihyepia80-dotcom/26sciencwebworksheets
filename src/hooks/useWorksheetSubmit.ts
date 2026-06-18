"use client";

import { useCallback, useState } from "react";
import type { AiRating } from "@/lib/ai/feedback";
import { fetchAiQuotaStatus, requestAiFeedback, type AiQuotaStatus } from "@/lib/ai/feedback";
import {
  getStudentFirebaseErrorMessage,
  isFirebaseConfigured,
  saveSubmission,
  updateSubmission,
} from "@/lib/firebase";
import { validateWorksheetValues } from "@/lib/worksheet-validation";
import type { Answers, WorksheetMeta } from "@/lib/types";

interface SubmitPayload {
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
  studentUid: string;
}

interface UseWorksheetSubmitOptions {
  aiQuota: AiQuotaStatus | null;
  setAiQuota: (quota: AiQuotaStatus) => void;
  onSuccess: (result: { submissionId: string; aiFeedback: string; aiRating: AiRating | null }) => void;
}

export function useWorksheetSubmit({ aiQuota, setAiQuota, onSuccess }: UseWorksheetSubmitOptions) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const submit = useCallback(
    async (payload: SubmitPayload, submissionId: string | null, existingFeedback: string, existingRating: AiRating | null) => {
      if (!isFirebaseConfigured()) {
        setSubmitError("Firebase 설정이 없습니다. .env 파일을 확인하세요.");
        return;
      }

      const validation = validateWorksheetValues(payload.templateId, payload.values);
      if (!validation.ok) {
        setSubmitError(validation.errors.slice(0, 5).join("\n"));
        return;
      }

      setSubmitting(true);
      setSubmitError("");

      try {
        let feedback = existingFeedback;
        let rating = existingRating;

        if (aiQuota?.available !== false) {
          try {
            const ai = await requestAiFeedback({
              studentUid: payload.studentUid,
              templateName: payload.templateName,
              meta: payload.meta,
              values: payload.values,
            });
            feedback = ai.feedback;
            rating = ai.rating;
            setAiQuota(await fetchAiQuotaStatus(payload.studentUid));
          } catch (error: unknown) {
            if (error instanceof Error && error.message === "QUOTA_EXCEEDED") {
              setAiQuota(await fetchAiQuotaStatus(payload.studentUid));
            } else {
              throw error;
            }
          }
        }

        const savePayload = {
          ...payload,
          ...(feedback && rating ? { aiFeedback: feedback, aiRating: rating } : {}),
        };

        let id: string;
        if (submissionId) {
          await updateSubmission(submissionId, savePayload);
          id = submissionId;
        } else {
          id = await saveSubmission(savePayload);
        }

        onSuccess({ submissionId: id, aiFeedback: feedback, aiRating: rating });
      } catch (error: unknown) {
        setSubmitError(getStudentFirebaseErrorMessage(error, "제출에 실패했습니다. 다시 시도해 주세요."));
      } finally {
        setSubmitting(false);
      }
    },
    [aiQuota, onSuccess, setAiQuota],
  );

  const clearError = useCallback(() => setSubmitError(""), []);

  return { submitting, submitError, submit, clearError, setSubmitError };
}
