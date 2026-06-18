import type { WorksheetMeta } from "@/lib/types";

export interface GenerateGuidedQuestionsInput {
  templateId: string;
  templateName: string;
  meta: Pick<WorksheetMeta, "topic" | "unit" | "grade" | "inquiryQuestion" | "writingContext">;
  count?: number;
}

export interface GenerateGuidedQuestionsResult {
  questions: string[];
  source: "ai";
}

export async function requestGuidedQuestions(
  input: GenerateGuidedQuestionsInput,
): Promise<GenerateGuidedQuestionsResult> {
  const res = await fetch("/api/guided-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      templateId: input.templateId,
      templateName: input.templateName,
      topic: input.meta.topic,
      unit: input.meta.unit,
      grade: input.meta.grade,
      inquiryQuestion: input.meta.inquiryQuestion,
      writingContext: input.meta.writingContext,
      count: input.count,
    }),
  });

  const data = (await res.json()) as GenerateGuidedQuestionsResult & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "유도 질문 생성에 실패했습니다.");
  }

  return data;
}
