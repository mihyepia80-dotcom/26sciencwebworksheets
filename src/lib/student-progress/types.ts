import type { AiRating } from "@/lib/ai/feedback";

export type TemplateProgressStatus = "none" | "draft" | "submitted";

export interface TemplateProgress {
  status: TemplateProgressStatus;
  aiRating: AiRating | null;
}

export const PROGRESS_LABELS: Record<TemplateProgressStatus, string> = {
  none: "미완료",
  draft: "작성 중",
  submitted: "완료",
};
