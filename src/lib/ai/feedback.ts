import type { Answers, WorksheetMeta } from "@/lib/types";

export type AiRating = "잘함" | "보통" | "노력요함";

export interface AiFeedbackResult {
  rating: AiRating;
  feedback: string;
}

export interface AiQuotaStatus {
  available: boolean;
  studentUsed: number;
  studentLimit: number;
  studentRemaining: number;
  globalUsed: number;
  globalLimit: number;
  globalRemaining: number;
  reason?: "student" | "global" | null;
}

const EMPTY_QUOTA: AiQuotaStatus = {
  available: false,
  studentUsed: 1,
  studentLimit: 1,
  studentRemaining: 0,
  globalUsed: 100,
  globalLimit: 100,
  globalRemaining: 0,
  reason: "student",
};

export async function fetchAiQuotaStatus(studentUid: string): Promise<AiQuotaStatus> {
  const res = await fetch(`/api/ai-status?studentUid=${encodeURIComponent(studentUid)}`);
  if (!res.ok) return EMPTY_QUOTA;
  return (await res.json()) as AiQuotaStatus;
}

export async function requestAiFeedback(input: {
  studentUid: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
}): Promise<AiFeedbackResult> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as AiFeedbackResult & {
    error?: string;
    quotaExceeded?: boolean;
    geminiQuotaExceeded?: boolean;
  };
  if (!res.ok) {
    if (res.status === 429 && (data.quotaExceeded || data.geminiQuotaExceeded)) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw new Error(data.error ?? "AI 피드백 생성에 실패했습니다.");
  }

  return data;
}

export const RATING_STYLES: Record<AiRating, string> = {
  잘함: "bg-green-100 text-green-800 border-green-200",
  보통: "bg-amber-100 text-amber-800 border-amber-200",
  "노력요함": "bg-orange-100 text-orange-800 border-orange-200",
};
