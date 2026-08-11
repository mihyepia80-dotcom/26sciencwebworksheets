import type { QbMode, QbRequest, QbResponse } from "./types";

export async function requestQuestionBot(body: QbRequest & { action?: "confirm"; finalQuestion?: string; quality?: number }): Promise<QbResponse> {
  const res = await fetch("/api/inquiry-question-bot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as QbResponse & { error?: string };
  if (!res.ok && !data.status) {
    throw new Error(data.error ?? "탐구 질문 도우미 요청에 실패했습니다.");
  }
  return data;
}

export async function fetchQuestionBotStatus(studentUid: string, unitId?: string, period?: string) {
  const q = new URLSearchParams({ studentUid });
  if (unitId) q.set("unitId", unitId);
  if (period) q.set("period", period);
  const res = await fetch(`/api/ai-status?${q.toString()}`);
  if (!res.ok) return null;
  return res.json() as Promise<{
    questionBot?: {
      enabled: boolean;
      turnsLeftThisPeriod: number;
      turnsLeftToday: number;
    };
  }>;
}
