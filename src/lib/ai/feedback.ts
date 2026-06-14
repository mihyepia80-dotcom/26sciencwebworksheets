import type { Answers, WorksheetMeta } from "@/lib/types";

export type AiRating = "잘함" | "보통" | "노력요함";

export interface AiFeedbackResult {
  rating: AiRating;
  feedback: string;
}

export async function requestAiFeedback(input: {
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
}): Promise<AiFeedbackResult> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as AiFeedbackResult & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "AI 피드백 생성에 실패했습니다.");
  }

  return data;
}

export const RATING_STYLES: Record<AiRating, string> = {
  잘함: "bg-green-100 text-green-800 border-green-200",
  보통: "bg-amber-100 text-amber-800 border-amber-200",
  "노력요함": "bg-orange-100 text-orange-800 border-orange-200",
};
