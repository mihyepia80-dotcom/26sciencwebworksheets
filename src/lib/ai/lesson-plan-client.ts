import type { LessonPlanForm } from "@/lib/lesson-plan/types";

export interface GenerateLessonPlanInput {
  unitId?: string;
  unit?: string;
  period?: string;
  learningTopic?: string;
  achievementStandards?: string;
  instruction?: string;
}

export interface GenerateLessonPlanResult {
  plan: LessonPlanForm;
  source: "ai";
}

export async function generateLessonPlanWithAi(
  input: GenerateLessonPlanInput,
): Promise<GenerateLessonPlanResult> {
  const res = await fetch("/api/lesson-plans/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as GenerateLessonPlanResult & {
    error?: string;
    geminiQuotaExceeded?: boolean;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "지도안 생성에 실패했습니다.");
  }
  return { plan: data.plan, source: "ai" };
}

export async function fetchLessonPlanFramework(): Promise<{
  framework: string;
  sample: LessonPlanForm;
}> {
  const res = await fetch("/api/lesson-plans/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "framework-only" }),
  });
  const data = (await res.json()) as { framework: string; sample: LessonPlanForm; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "틀 불러오기 실패");
  }
  return { framework: data.framework, sample: data.sample };
}
