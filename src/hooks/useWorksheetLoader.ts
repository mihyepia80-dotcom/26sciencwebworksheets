"use client";

import { useEffect, useState } from "react";
import type { AiRating } from "@/lib/ai/feedback";
import { getSubmission } from "@/lib/firebase";
import type { Answers, WorksheetMeta } from "@/lib/types";

interface LoadedSubmission {
  submissionId: string;
  meta: WorksheetMeta;
  values: Answers;
  aiFeedback: string;
  aiRating: AiRating | null;
}

interface UseWorksheetLoaderOptions {
  editSubmissionId: string | null;
  templateId: string;
  studentUid: string | undefined;
  enabled: boolean;
  onLoaded: (data: LoadedSubmission) => void;
}

export function useWorksheetLoader({
  editSubmissionId,
  templateId,
  studentUid,
  enabled,
  onLoaded,
}: UseWorksheetLoaderOptions) {
  const [loading, setLoading] = useState(Boolean(editSubmissionId && enabled));
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!editSubmissionId || !enabled || !studentUid) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError("");

    getSubmission(editSubmissionId)
      .then((submission) => {
        if (cancelled) return;
        if (!submission || submission.studentUid !== studentUid || submission.templateId !== templateId) {
          setLoadError("활동지를 불러올 수 없습니다.");
          return;
        }
        onLoaded({
          submissionId: submission.id ?? editSubmissionId,
          meta: submission.meta,
          values: submission.values,
          aiFeedback: submission.aiFeedback ?? "",
          aiRating: submission.aiRating ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError("활동지를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editSubmissionId, enabled, studentUid, templateId, onLoaded]);

  return { loading, loadError };
}
