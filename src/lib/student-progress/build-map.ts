import type { WorksheetSubmission } from "@/lib/firebase/submissions";
import type { TemplateProgress } from "./types";

function submissionSortTime(submission: WorksheetSubmission): number {
  const ts = submission.updatedAt ?? submission.submittedAt;
  return ts?.toMillis() ?? 0;
}

/** templateId별 최신 제출·임시저장 상태 집계 */
export function buildTemplateProgressMap(
  submissions: WorksheetSubmission[],
): Map<string, TemplateProgress> {
  const byTemplate = new Map<string, WorksheetSubmission[]>();

  for (const submission of submissions) {
    const list = byTemplate.get(submission.templateId) ?? [];
    list.push(submission);
    byTemplate.set(submission.templateId, list);
  }

  const result = new Map<string, TemplateProgress>();

  for (const [templateId, list] of byTemplate) {
    const submitted = list
      .filter((s) => s.status === "submitted")
      .sort((a, b) => submissionSortTime(b) - submissionSortTime(a))[0];

    if (submitted) {
      result.set(templateId, {
        status: "submitted",
        aiRating: submitted.aiRating ?? null,
      });
      continue;
    }

    const draft = list.find((s) => s.status === "draft");
    if (draft) {
      result.set(templateId, { status: "draft", aiRating: null });
    }
  }

  return result;
}
