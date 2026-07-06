"use client";

import { useCallback, useState } from "react";
import {
  getStudentFirebaseErrorMessage,
  isFirebaseConfigured,
  saveSubmissionDraft,
  updateSubmissionDraft,
} from "@/lib/firebase";
import type { WorksheetSubmission } from "@/lib/firebase/submissions";
import type { Answers, WorksheetMeta } from "@/lib/types";

interface DraftPayload {
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
  studentUid: string;
  linkedReportId?: string;
  instanceNo?: number;
}

interface UseWorksheetDraftOptions {
  onSuccess: (result: { submissionId: string }) => void;
}

export function useWorksheetDraft({ onSuccess }: UseWorksheetDraftOptions) {
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [draftError, setDraftError] = useState("");

  const saveDraft = useCallback(
    async (payload: DraftPayload, submissionId: string | null, isSubmitted: boolean) => {
      if (!isFirebaseConfigured()) {
        setDraftError("Firebase 설정이 없습니다. Vercel 환경 변수를 확인하세요.");
        return;
      }
      if (isSubmitted) return;

      setSavingDraft(true);
      setDraftError("");
      setDraftMessage("");

      try {
        let id = submissionId;
        if (id) {
          await updateSubmissionDraft(id, payload);
        } else {
          id = await saveSubmissionDraft(payload);
        }
        onSuccess({ submissionId: id });
        setDraftMessage("임시 저장되었습니다.");
      } catch (error: unknown) {
        setDraftError(getStudentFirebaseErrorMessage(error, "임시 저장에 실패했습니다. 다시 시도해 주세요."));
      } finally {
        setSavingDraft(false);
      }
    },
    [onSuccess],
  );

  const clearDraftFeedback = useCallback(() => {
    setDraftError("");
    setDraftMessage("");
  }, []);

  return { savingDraft, draftMessage, draftError, saveDraft, clearDraftFeedback };
}
