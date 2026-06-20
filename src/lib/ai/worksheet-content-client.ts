export interface ReviseWorksheetContentInput {
  templateId: string;
  templateName: string;
  fields: Record<string, string>;
  instruction?: string;
  topic?: string;
  unit?: string;
}

export interface ReviseWorksheetContentResult {
  fields: Record<string, string>;
  source: "ai";
}

export async function reviseWorksheetContentWithAi(
  input: ReviseWorksheetContentInput,
): Promise<ReviseWorksheetContentResult> {
  const res = await fetch("/api/worksheet-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as ReviseWorksheetContentResult & {
    error?: string;
    geminiQuotaExceeded?: boolean;
    retryAfterSeconds?: number;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "AI 문구 수정에 실패했습니다.");
  }
  return { fields: data.fields, source: "ai" };
}
