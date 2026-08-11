"use client";

import { useEffect, useState } from "react";
import type { AiRating } from "@/lib/ai/feedback";
import {
  findStudentDraftForReport,
  findStudentDraftForTemplate,
  getSubmission,
} from "@/lib/firebase";
import type { SubmissionPadletPost } from "@/lib/padlet/publish-types";
import type { WorksheetSubmissionStatus } from "@/lib/firebase/submissions";
import type { Answers, WorksheetMeta } from "@/lib/types";

interface LoadedSubmission {
  submissionId: string;
  meta: WorksheetMeta;
  values: Answers;
  aiFeedback: string;
  aiRating: AiRating | null;
  status: WorksheetSubmissionStatus;
  linkedReportId?: string;
  instanceNo?: number;
  padletPost?: SubmissionPadletPost;
}

interface UseWorksheetLoaderOptions {
  editSubmissionId: string | null;
  templateId: string;
  studentUid: string | undefined;
  linkedReportId?: string;
  enabled: boolean;
  onLoaded: (data: LoadedSubmission) => void;
}

export function useWorksheetLoader({
  editSubmissionId,
  templateId,
  studentUid,
  linkedReportId,
  enabled,
  onLoaded,
}: UseWorksheetLoaderOptions) {
  const [loading, setLoading] = useState(Boolean(enabled && studentUid));
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!enabled || !studentUid) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError("");

    const load = async () => {
      try {
        let submission = editSubmissionId ? await getSubmission(editSubmissionId) : null;

        if (!submission && linkedReportId) {
          submission = await findStudentDraftForReport(
            studentUid,
            templateId,
            linkedReportId,
            editSubmissionId,
          );
        }

        if (!submission && !linkedReportId) {
          submission = await findStudentDraftForTemplate(studentUid, templateId);
        }

        if (cancelled) return;

        if (!submission || submission.studentUid !== studentUid || submission.templateId !== templateId) {
          if (editSubmissionId) {
            setLoadError("활동지를 불러올 수 없습니다.");
          } else {
            setLoadError("");
          }
          return;
        }

        onLoaded({
          submissionId: submission.id ?? editSubmissionId ?? "",
          meta: submission.meta,
          values: submission.values,
          aiFeedback: submission.aiFeedback ?? "",
          aiRating: submission.aiRating ?? null,
          status: submission.status,
          linkedReportId: submission.linkedReportId,
          instanceNo: submission.instanceNo,
          padletPost: submission.padletPost,
        });
      } catch {
        if (!cancelled) setLoadError("활동지를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [editSubmissionId, enabled, linkedReportId, studentUid, templateId, onLoaded]);

  return { loading, loadError };
}
